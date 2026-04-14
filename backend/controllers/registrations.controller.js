const mongoose = require('mongoose');
const Registration = require('../models/registration.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');

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

    const employeeExists = await User.exists({ _id: employeeId });
    if (!employeeExists) {
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

    res.json({ message: 'Registration deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listRegistrations,
  listRegistrationsWithActivity,
  createRegistration,
  deleteRegistration,
};
