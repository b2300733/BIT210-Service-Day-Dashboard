require('dotenv').config();
const crypto = require('crypto');
const { pool, query } = require('../db');

const emailUrl = () => process.env.AP_Url;

const sendEmail = async (payload) => {
  if (!emailUrl()) throw new Error('AP_Url is not configured.');
  const response = await fetch(emailUrl(), { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Email request failed.');
};

const mapRegistration = (row) => ({
  _id: row.id,
  employeeId: row.employee_id,
  activityId: row.activity_id,
  qrData: row.qr_data,
  qrGeneratedAt: row.qr_generated_at,
  qrchecked: Boolean(row.qr_checked),
  checkedInAt: row.checked_in_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatDateParts = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const pad = (number) => String(number).padStart(2, '0');
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

const listRegistrations = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const [rows] = await query('SELECT * FROM registrations WHERE employee_id = ?', [employeeId]);
    res.json(rows.map(mapRegistration));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listRegistrationsWithActivity = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) return res.status(400).json({ message: 'employeeId is required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const [rows] = await query(
      `SELECT r.id, r.employee_id, r.created_at, r.updated_at,
              a.id AS activity_id, a.name, a.service_type, a.schedule_date, a.schedule_time,
              a.location, a.description, a.cutoff_date, a.cutoff_time
       FROM registrations r JOIN activities a ON a.id = r.activity_id
       WHERE r.employee_id = ?`,
      [employeeId],
    );
    res.json(rows.map((row) => ({
      _id: row.id,
      employeeId: row.employee_id,
      activity: {
        _id: row.activity_id,
        name: row.name,
        serviceType: row.service_type,
        scheduleDate: row.schedule_date,
        scheduleTime: row.schedule_time,
        location: row.location,
        description: row.description,
        cutoffDate: row.cutoff_date,
        cutoffTime: row.cutoff_time,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listRegistrationsWithEmployee = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT r.*, u.name AS employee_name, u.email, u.department, a.name AS activity_name
       FROM registrations r
       JOIN users u ON u.id = r.employee_id
       JOIN activities a ON a.id = r.activity_id
       ORDER BY r.created_at DESC`,
    );
    res.json(rows.map((row) => {
      const { date, time } = formatDateParts(row.created_at || row.updated_at);
      return {
        _id: row.id,
        employeeName: row.employee_name,
        email: row.email,
        department: row.department,
        activity: row.activity_name,
        registeredDate: date,
        registeredTime: time,
        qrData: row.qr_data,
        qrchecked: Boolean(row.qr_checked),
        status: row.qr_checked ? 'checked-in' : 'pending',
        checkedInAt: row.checked_in_at,
      };
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkInByQrData = async (req, res) => {
  try {
    const qrData = req.body?.qrData?.trim();
    if (!qrData) return res.status(400).json({ message: 'qrData is required.' });
    const [rows] = await query(
      `SELECT r.*, u.name AS employee_name, u.email, u.department, a.name AS activity_name
       FROM registrations r
       JOIN users u ON u.id = r.employee_id
       JOIN activities a ON a.id = r.activity_id
       WHERE r.qr_data = ?`,
      [qrData],
    );
    const registration = rows[0];
    if (!registration) return res.status(404).json({ message: 'QR code not found.' });
    if (!registration.qr_checked) {
      await query('UPDATE registrations SET qr_checked = TRUE, checked_in_at = NOW() WHERE id = ?', [registration.id]);
      registration.qr_checked = 1;
      registration.checked_in_at = new Date();
    }
    res.json({
      _id: registration.id,
      employeeId: registration.employee_id,
      employeeName: registration.employee_name,
      email: registration.email,
      department: registration.department,
      activityId: registration.activity_id,
      activityName: registration.activity_name,
      qrData: registration.qr_data,
      qrchecked: Boolean(registration.qr_checked),
      status: 'checked-in',
      checkedInAt: registration.checked_in_at,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateQrCodesForActivity = async (req, res) => {
  try {
    const activityId = req.body?.activityId?.trim();
    if (!activityId) return res.status(400).json({ message: 'activityId is required.' });
    const [activities] = await query('SELECT * FROM activities WHERE id = ?', [activityId]);
    const activity = activities[0];
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (new Date(`${activity.cutoff_date}T${activity.cutoff_time}`) > new Date()) {
      return res.status(409).json({ message: `Cannot generate QR codes before cutoff time (${activity.cutoff_date} at ${activity.cutoff_time}).` });
    }

    const [registrations] = await query(
      `SELECT r.*, u.name AS employee_name, u.email, a.name AS activity_name
       FROM registrations r JOIN users u ON u.id = r.employee_id
       JOIN activities a ON a.id = r.activity_id WHERE r.activity_id = ?`,
      [activityId],
    );
    for (const registration of registrations) {
      if (!registration.qr_data) {
        const qrData = `serviceday:${activityId}:${registration.employee_id}:${crypto.randomUUID()}`;
        await query('UPDATE registrations SET qr_data = ?, qr_generated_at = NOW() WHERE id = ?', [qrData, registration.id]);
        registration.qr_data = qrData;
      }
    }
    const records = registrations.map((row) => ({
      _id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      email: row.email,
      activityId,
      activityName: row.activity_name,
      qrData: row.qr_data,
      qrchecked: Boolean(row.qr_checked),
      status: row.qr_checked ? 'checked-in' : 'pending',
      checkedInAt: row.checked_in_at,
    }));
    await Promise.all(records.filter((row) => row.email).map((row) => sendEmail({
      action: 'qr',
      to: row.email,
      employeeName: row.employeeName,
      activity: row.activityName,
      activityId,
      serviceType: activity.service_type,
      scheduleDate: activity.schedule_date,
      scheduleTime: activity.schedule_time,
      location: activity.location,
      qrData: row.qrData,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(row.qrData)}`,
    }).catch((error) => console.error(`QR email failed for ${row.email}:`, error.message))));
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRegistration = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const employeeId = req.body?.employeeId?.trim();
    const activityId = req.body?.activityId?.trim();
    if (!employeeId || !activityId) return res.status(400).json({ message: 'employeeId and activityId are required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    await connection.beginTransaction();
    const [employees] = await connection.execute('SELECT id, name, email FROM users WHERE id = ?', [employeeId]);
    const [activities] = await connection.execute('SELECT * FROM activities WHERE id = ? FOR UPDATE', [activityId]);
    const employee = employees[0];
    const activity = activities[0];
    if (!employee) {
      await connection.rollback();
      return res.status(404).json({ message: 'Employee not found.' });
    }
    if (!activity) {
      await connection.rollback();
      return res.status(404).json({ message: 'Activity not found.' });
    }
    if (activity.registered >= activity.total_slots) {
      await connection.rollback();
      return res.status(409).json({ message: 'No slots available.' });
    }
    const [existing] = await connection.execute('SELECT id FROM registrations WHERE employee_id = ? AND activity_id = ?', [employeeId, activityId]);
    if (existing[0]) {
      await connection.rollback();
      return res.status(409).json({ message: 'Registration already exists.' });
    }
    const id = crypto.randomUUID();
    await connection.execute('INSERT INTO registrations (id, employee_id, activity_id) VALUES (?, ?, ?)', [id, employeeId, activityId]);
    await connection.execute('UPDATE activities SET registered = registered + 1 WHERE id = ?', [activityId]);
    await connection.commit();
    if (employee.email) {
      await sendEmail({
        action: 'registration',
        to: employee.email,
        employeeName: employee.name,
        activity: activity.name,
        scheduleDate: activity.schedule_date,
        scheduleTime: activity.schedule_time,
        location: activity.location,
        serviceType: activity.service_type,
      }).catch((error) => console.error('Registration email failed:', error.message));
    }
    const [rows] = await query('SELECT * FROM registrations WHERE id = ?', [id]);
    res.status(201).json(mapRegistration(rows[0]));
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Registration already exists.' });
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    const activityId = req.query.activityId?.trim();
    if (!employeeId || !activityId) return res.status(400).json({ message: 'employeeId and activityId are required.' });
    if (req.user.role !== 'admin' && req.user._id !== employeeId) return res.status(403).json({ message: 'Forbidden.' });
    const [activities] = await query('SELECT * FROM activities WHERE id = ?', [activityId]);
    const activity = activities[0];
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    if (new Date(`${activity.cutoff_date}T${activity.cutoff_time}`) < new Date()) return res.status(409).json({ message: 'Cancellation cutoff has passed.' });
    const [employees] = await query('SELECT name, email FROM users WHERE id = ?', [employeeId]);
    if (!employees[0]) return res.status(404).json({ message: 'Employee not found.' });
    const [result] = await query('DELETE FROM registrations WHERE employee_id = ? AND activity_id = ?', [employeeId, activityId]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Registration not found.' });
    await query('UPDATE activities SET registered = GREATEST(registered - 1, 0) WHERE id = ?', [activityId]);
    await sendEmail({
      action: 'cancellation',
      to: employees[0].email,
      employeeName: employees[0].name,
      activity: activity.name,
      scheduleDate: activity.schedule_date,
      scheduleTime: activity.schedule_time,
      location: activity.location,
      serviceType: activity.service_type,
    }).catch((error) => console.error('Cancellation email failed:', error.message));
    res.json({ message: 'Registration deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listRegistrations,
  listRegistrationsWithActivity,
  listRegistrationsWithEmployee,
  generateQrCodesForActivity,
  checkInByQrData,
  createRegistration,
  deleteRegistration,
};
