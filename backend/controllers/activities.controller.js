const Activity = require('../models/activity.model');
const Registration = require('../models/registration.model');

const trimActivityPayload = (payload = {}) => ({
  ...payload,
  name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
  serviceType:
    typeof payload.serviceType === 'string' ? payload.serviceType.trim() : payload.serviceType,
  scheduleDate:
    typeof payload.scheduleDate === 'string' ? payload.scheduleDate.trim() : payload.scheduleDate,
  scheduleTime:
    typeof payload.scheduleTime === 'string' ? payload.scheduleTime.trim() : payload.scheduleTime,
  location: typeof payload.location === 'string' ? payload.location.trim() : payload.location,
  cutoffDate:
    typeof payload.cutoffDate === 'string' ? payload.cutoffDate.trim() : payload.cutoffDate,
  cutoffTime:
    typeof payload.cutoffTime === 'string' ? payload.cutoffTime.trim() : payload.cutoffTime,
  description:
    typeof payload.description === 'string' ? payload.description.trim() : payload.description,
});

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createActivity = async (req, res) => {
  const activity = new Activity(trimActivityPayload(req.body));
  try {
    const newActivity = await activity.save();
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const existingActivity = await Activity.findById(req.params.id);
    if (!existingActivity) return res.status(404).json({ message: 'Activity not found' });

    const requestedTotalSlots = Number(req.body?.totalSlots);
    if (Number.isFinite(requestedTotalSlots) && requestedTotalSlots < existingActivity.registered) {
      return res.status(409).json({
        message: `Total slots cannot be lower than the number of registered employees (${existingActivity.registered}).`,
      });
    }

    const updateData = {
      ...trimActivityPayload(req.body),
      registered: existingActivity.registered,
    };

    const updatedActivity = await Activity.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    res.json(updatedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const deletedRegistrations = await Registration.deleteMany({ activityId: req.params.id });
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    if (!deletedActivity) return res.status(404).json({ message: 'Activity not found' });
    res.json({
      message: 'Activity deleted',
      deletedRegistrations: deletedRegistrations.deletedCount ?? 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
};
