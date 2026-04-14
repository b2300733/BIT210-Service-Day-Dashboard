const Activity = require('../models/activity.model');

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createActivity = async (req, res) => {
  const activity = new Activity(req.body);
  try {
    const newActivity = await activity.save();
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedActivity) return res.status(404).json({ message: 'Activity not found' });
    res.json(updatedActivity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const deletedActivity = await Activity.findByIdAndDelete(req.params.id);
    if (!deletedActivity) return res.status(404).json({ message: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
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
