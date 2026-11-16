const Activity = require('../models/activity.model');
const Registration = require('../models/registration.model');

const trimActivityPayload = (payload = {}) => ({
  name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
  serviceType: typeof payload.serviceType === 'string' ? payload.serviceType.trim() : payload.serviceType,
  scheduleDate: typeof payload.scheduleDate === 'string' ? payload.scheduleDate.trim() : payload.scheduleDate,
  scheduleTime: typeof payload.scheduleTime === 'string' ? payload.scheduleTime.trim() : payload.scheduleTime,
  location: typeof payload.location === 'string' ? payload.location.trim() : payload.location,
  totalSlots: Number(payload.totalSlots),
  cutoffDate: typeof payload.cutoffDate === 'string' ? payload.cutoffDate.trim() : payload.cutoffDate,
  cutoffTime: typeof payload.cutoffTime === 'string' ? payload.cutoffTime.trim() : payload.cutoffTime,
  description: typeof payload.description === 'string' ? payload.description.trim() : payload.description,
});

const isCutoffPassed = (activity) => {
  const date = new Date(`${activity.cutoffDate}T${activity.cutoffTime}`);
  return !Number.isNaN(date.getTime()) && date < new Date();
};

const getActivities = async (req, res) => {
  try { res.json(await Activity.findAll()); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const createActivity = async (req, res) => {
  try { res.status(201).json(await Activity.create(trimActivityPayload(req.body))); }
  catch (err) { res.status(400).json({ message: err.message }); }
};

const updateActivity = async (req, res) => {
  try {
    const existing = await Activity.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Activity not found' });
    if (isCutoffPassed(existing)) return res.status(409).json({ message: 'Activity cutoff has passed.' });
    const updateData = trimActivityPayload(req.body);
    if (Number.isFinite(updateData.totalSlots) && updateData.totalSlots < existing.registered) {
      return res.status(409).json({
        message: `Total slots cannot be lower than the number of registered employees (${existing.registered}).`,
      });
    }
    res.json(await Activity.update(req.params.id, updateData));
  } catch (err) { res.status(400).json({ message: err.message }); }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (isCutoffPassed(activity)) return res.status(409).json({ message: 'Activity cutoff has passed.' });
    const deletedRegistrations = await Registration.removeByActivity(req.params.id);
    await Activity.remove(req.params.id);
    res.json({ message: 'Activity deleted', deletedRegistrations });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getActivities, createActivity, updateActivity, deleteActivity };
