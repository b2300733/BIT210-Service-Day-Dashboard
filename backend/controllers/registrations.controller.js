require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Registration = require('../models/registration.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');

const getApdUrl = () => process.env.AP_Url;

const sendEmail = async (payload) => {
  const apdUrl = getApdUrl();
  if (!apdUrl) {
    throw new Error('APD_Url is not configured.');
  }

  const response = await fetch(apdUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Email request failed.');
  }
};

const formatDateParts = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: '', time: '' };
  }

  const pad = (num) => String(num).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return { date: datePart, time: timePart };
};

const mapCheckInRecords = (registrations) =>
  registrations
    .filter((registration) => registration.employeeId && registration.activityId)
    .map((registration) => ({
      _id: registration._id,
      employeeId: registration.employeeId._id,
      employeeName: registration.employeeId.name,
      email: registration.employeeId.email,
      department: registration.employeeId.department,
      activityId: registration.activityId._id,
      activityName: registration.activityId.name,
      qrData: registration.qrData ?? null,
      qrchecked: Boolean(registration.qrchecked),
      status: registration.qrchecked ? 'checked-in' : 'pending',
      checkedInAt: registration.checkedInAt ? registration.checkedInAt.toISOString() : null,
    }));

const buildQrPayload = (activityId, employeeId) =>
  `serviceday:${activityId}:${employeeId}:${crypto.randomUUID()}`;

const buildQrImageUrl = (qrData) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

const listRegistrations = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId must be a valid id.' });
    }

    const registrations = await Registration.find({ employeeId }).select('-__v');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listRegistrationsWithActivity = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId must be a valid id.' });
    }

    const registrations = await Registration.find({ employeeId })
      .populate({
        path: 'activityId',
        select:
          'name serviceType scheduleDate scheduleTime location description cutoffDate cutoffTime',
      })
      .select('-__v')
      .lean();

    const result = registrations
      .filter((registration) => registration.activityId)
      .map((registration) => ({
        _id: registration._id,
        employeeId: registration.employeeId,
        activity: registration.activityId,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
      }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listRegistrationsWithEmployee = async (req, res) => {
  try {
    const activityId = req.query.activityId?.trim();
    const filters = {};

    if (activityId) {
      if (!mongoose.Types.ObjectId.isValid(activityId)) {
        return res.status(400).json({ message: 'activityId must be a valid id.' });
      }
      filters.activityId = activityId;
    }

    const registrations = await Registration.find(filters)
      .populate({ path: 'employeeId', select: 'name email department' })
      .populate({ path: 'activityId', select: 'name' })
      .select('-__v')
      .lean();

    const result = registrations
      .filter((registration) => registration.employeeId && registration.activityId)
      .map((registration) => {
        const { date, time } = formatDateParts(registration.createdAt || registration.updatedAt);
        return {
          _id: registration._id,
          employeeName: registration.employeeId.name,
          email: registration.employeeId.email,
          department: registration.employeeId.department,
          activity: registration.activityId.name,
          registeredDate: date,
          registeredTime: time,
          qrData: registration.qrData ?? null,
          qrchecked: Boolean(registration.qrchecked),
          status: registration.qrchecked ? 'checked-in' : 'pending',
          checkedInAt: registration.checkedInAt ? registration.checkedInAt.toISOString() : null,
        };
      });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkInByQrData = async (req, res) => {
  try {
    const qrData = req.body?.qrData?.trim();
    if (!qrData) {
      return res.status(400).json({ message: 'qrData is required.' });
    }

    const registration = await Registration.findOne({ qrData })
      .populate({ path: 'employeeId', select: 'name email department' })
      .populate({ path: 'activityId', select: 'name' });

    if (!registration) {
      return res.status(404).json({ message: 'QR code not found.' });
    }

    if (!registration.qrchecked) {
      registration.qrchecked = true;
      registration.checkedInAt = new Date();
      await registration.save();
    }

    res.json(mapCheckInRecords([registration])[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateQrCodesForActivity = async (req, res) => {
  try {
    const activityId = req.body?.activityId?.trim();
    if (!activityId) {
      return res.status(400).json({ message: 'activityId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: 'activityId must be a valid id.' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    // NOTE: Cutoff enforcement disabled for testing.

    const registrations = await Registration.find({ activityId })
      .populate({ path: 'employeeId', select: 'name email department' })
      .populate({ path: 'activityId', select: 'name' })
      .select('-__v')
      .lean();

    const updates = registrations
      .filter((registration) => !registration.qrData)
      .map((registration) => ({
        updateOne: {
          filter: { _id: registration._id, qrData: { $in: [null, undefined] } },
          update: {
            $set: {
              qrData: buildQrPayload(activityId, registration.employeeId._id),
              qrGeneratedAt: new Date(),
            },
          },
        },
      }));

    if (updates.length > 0) {
      await Registration.bulkWrite(updates);
    }

    const refreshed = await Registration.find({ activityId })
      .populate({ path: 'employeeId', select: 'name email department' })
      .populate({ path: 'activityId', select: 'name' })
      .select('-__v')
      .lean();

    const records = mapCheckInRecords(refreshed);

    const emailTargets = records.filter((record) => record.email && record.qrData);
    if (emailTargets.length) {
      await Promise.all(
        emailTargets.map((record) =>
          sendEmail({
            action: 'qr',
            to: record.email,
            employeeName: record.employeeName,
            activity: record.activityName,
            activityId,
            serviceType: activity.serviceType,
            scheduleDate: activity.scheduleDate,
            scheduleTime: activity.scheduleTime,
            location: activity.location,
            qrData: record.qrData,
            qrImageUrl: buildQrImageUrl(record.qrData),
          }).catch((err) => {
            console.error(`QR email failed for ${record.email}:`, err);
          }),
        ),
      );
    }

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createRegistration = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId?.trim();
    const activityId = req.body?.activityId?.trim();

    if (!employeeId || !activityId) {
      return res.status(400).json({ message: 'employeeId and activityId are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId must be a valid id.' });
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: 'activityId must be a valid id.' });
    }

    const employee = await User.findById(employeeId).select('name email');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    if (activity.registered >= activity.totalSlots) {
      return res.status(409).json({ message: 'No slots available.' });
    }

    const existing = await Registration.findOne({ employeeId, activityId });
    if (existing) {
      return res.status(409).json({ message: 'Registration already exists.' });
    }

    const registration = await Registration.create({ employeeId, activityId });
    await Activity.findByIdAndUpdate(activityId, { $inc: { registered: 1 } });

    if (employee.email) {
      try {
        await sendEmail({
          action: 'registration',
          to: employee.email,
          employeeName: employee.name,
          activity: activity.name,
          scheduleDate: activity.scheduleDate,
          scheduleTime: activity.scheduleTime,
          location: activity.location,
          serviceType: activity.serviceType,
        });
      } catch (err) {
        console.error('Registration email failed:', err);
      }
    }

    res.status(201).json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRegistration = async (req, res) => {
  try {
    const employeeId = req.query.employeeId?.trim();
    const activityId = req.query.activityId?.trim();

    if (!employeeId || !activityId) {
      return res.status(400).json({ message: 'employeeId and activityId are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'employeeId must be a valid id.' });
    }

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ message: 'activityId must be a valid id.' });
    }

    const deleted = await Registration.findOneAndDelete({ employeeId, activityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    const employee = await User.findById(employeeId).select('name email');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    const cutoffDateTime = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);
    if (!Number.isNaN(cutoffDateTime.getTime()) && cutoffDateTime < new Date()) {
      return res.status(409).json({ message: 'Cancellation cutoff has passed.' });
    }

    if (activity.registered > 0) {
      await Activity.findByIdAndUpdate(activityId, { $inc: { registered: -1 } });
    }

    if (employee.email) {
      try {
        await sendEmail({
          action: 'cancellation',
          to: employee.email,
          employeeName: employee.name,
          activity: activity.name,
          scheduleDate: activity.scheduleDate,
          scheduleTime: activity.scheduleTime,
          location: activity.location,
          serviceType: activity.serviceType,
        });
      } catch (err) {
        console.error('Cancellation email failed:', err);
      }
    }

    res.json({ message: 'Registration deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
