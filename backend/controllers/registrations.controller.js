require('dotenv').config();
const crypto = require('crypto');
const { query } = require('../db');
const Registration = require('../models/registration.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');

const validId = (value) => /^\d+$/.test(String(value || ''));
const getApdUrl = () => process.env.AP_Url;
const sendEmail = async (payload) => {
  if (!getApdUrl()) throw new Error('APD_Url is not configured.');
  const response = await fetch(getApdUrl(), { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Email request failed.');
};
const withDetails = async (where = '', params = []) => {
  const [rows] = await query(
    `SELECT r.*, u.name AS employee_name, u.email, u.department,
      a.name AS activity_name, a.service_type, a.schedule_date, a.schedule_time, a.location
     FROM registrations r JOIN users u ON u.id = r.employee_id
     JOIN activities a ON a.id = r.activity_id ${where} ORDER BY r.created_at DESC`,
    params,
  );
  return rows;
};
const mapRecord = (row) => ({
  _id: row.id, employeeId: row.employee_id, employeeName: row.employee_name, email: row.email,
  department: row.department, activityId: row.activity_id, activityName: row.activity_name,
  qrData: row.qr_data, qrchecked: Boolean(row.qr_checked),
  status: row.qr_checked ? 'checked-in' : 'pending',
  checkedInAt: row.checked_in_at ? new Date(row.checked_in_at).toISOString() : null,
});
const sendRegistrationEmail = async (action, employee, activity) => {
  if (!employee?.email) return;
  try {
    await sendEmail({ action, to: employee.email, employeeName: employee.name, activity: activity.name,
      scheduleDate: activity.scheduleDate, scheduleTime: activity.scheduleTime, location: activity.location,
      serviceType: activity.serviceType });
  } catch (err) { console.error(`${action} email failed:`, err); }
};

const listRegistrations = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    if (!validId(employeeId)) return res.status(400).json({ message: 'employeeId must be a valid id.' });
    res.json(await Registration.findByEmployee(employeeId));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const listRegistrationsWithActivity = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    const rows = await withDetails('WHERE r.employee_id = ?', [employeeId]);
    res.json(rows.map((row) => ({ _id: row.id, employeeId: row.employee_id, activity: {
      _id: row.activity_id, name: row.activity_name, serviceType: row.service_type,
      scheduleDate: row.schedule_date, scheduleTime: row.schedule_time, location: row.location,
    }, createdAt: row.created_at, updatedAt: row.updated_at })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const listRegistrationsWithEmployee = async (req, res) => {
  try {
    const activityId = req.query.activityId?.trim();
    const rows = await withDetails(activityId ? 'WHERE r.activity_id = ?' : '', activityId ? [activityId] : []);
    res.json(rows.map((row) => ({ ...mapRecord(row), activity: row.activity_name,
      registeredDate: new Date(row.created_at).toISOString().slice(0, 10),
      registeredTime: new Date(row.created_at).toTimeString().slice(0, 5) })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const checkInByQrData = async (req, res) => {
  try {
    const qrData = req.body?.qrData?.trim();
    if (!qrData) return res.status(400).json({ message: 'qrData is required.' });
    const registration = await Registration.findByQrData(qrData);
    if (!registration) return res.status(404).json({ message: 'QR code not found.' });
    if (!registration.qrchecked) await Registration.update(registration._id, { qrchecked: true, checkedInAt: new Date() });
    const [rows] = await query(
      `SELECT r.*, u.name AS employee_name, u.email, u.department, a.name AS activity_name
       FROM registrations r JOIN users u ON u.id = r.employee_id JOIN activities a ON a.id = r.activity_id WHERE r.id = ?`, [registration._id]);
    res.json(mapRecord(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const generateQrCodesForActivity = async (req, res) => {
  try {
    const activityId = req.body?.activityId?.trim();
    if (!validId(activityId)) return res.status(400).json({ message: 'activityId must be a valid id.' });
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const cutoff = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);
    if (!Number.isNaN(cutoff.getTime()) && cutoff > new Date()) return res.status(409).json({ message: 'Cannot generate QR codes before cutoff time.' });
    const registrations = await Registration.findByActivity(activityId);
    for (const registration of registrations) {
      if (!registration.qrData) await Registration.update(registration._id, {
        qrData: `serviceday:${activityId}:${registration.employeeId}:${crypto.randomUUID()}`, qrGeneratedAt: new Date(),
      });
    }
    const rows = await withDetails('WHERE r.activity_id = ?', [activityId]);
    const records = rows.map(mapRecord);
    res.json(records);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const createRegistration = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId?.trim();
    const activityId = req.body?.activityId?.trim();
    if (!validId(employeeId) || !validId(activityId)) return res.status(400).json({ message: 'employeeId and activityId must be valid ids.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    const employee = await User.findById(employeeId);
    const activity = await Activity.findById(activityId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (activity.registered >= activity.totalSlots) return res.status(409).json({ message: 'No slots available.' });
    if (await Registration.findByPair(employeeId, activityId)) return res.status(409).json({ message: 'Registration already exists.' });
    const registration = await Registration.create(employeeId, activityId);
    await Activity.incrementRegistered(activityId, 1);
    await sendRegistrationEmail('registration', employee, activity);
    res.status(201).json(registration);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const deleteRegistration = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    const activityId = req.query.activityId?.trim();
    if (!validId(employeeId) || !validId(activityId)) return res.status(400).json({ message: 'employeeId and activityId must be valid ids.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const cutoff = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);
    if (!Number.isNaN(cutoff.getTime()) && cutoff < new Date()) return res.status(409).json({ message: 'Cancellation cutoff has passed.' });
    if (!(await Registration.remove(employeeId, activityId))) return res.status(404).json({ message: 'Registration not found.' });
    await Activity.incrementRegistered(activityId, -1);
    await sendRegistrationEmail('cancellation', await User.findById(employeeId), activity);
    res.json({ message: 'Registration deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { listRegistrations, listRegistrationsWithActivity, listRegistrationsWithEmployee,
  generateQrCodesForActivity, checkInByQrData, createRegistration, deleteRegistration };
