require('dotenv').config();
const Reminder = require('../models/reminder.model');
const Activity = require('../models/activity.model');
const Registration = require('../models/registration.model');
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

const buildScheduledFor = (interval) => {
  const daysMap = { '1-week': 7, '3-day': 3, '1-day': 1 };
  const days = daysMap[interval];
  if (!days) {
    return null;
  }

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + days);
  return `${scheduledDate.toLocaleDateString('en-US')} 05:00 PM`;
};

const listReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createReminder = async (req, res) => {
  try {
    const activity = req.body?.activity?.trim();
    const type = req.body?.type?.trim() || req.body?.interval?.trim();
    const scheduledFor = req.body?.scheduledFor?.trim() || buildScheduledFor(type);

    if (!activity || !type || !scheduledFor) {
      return res.status(400).json({ message: 'activity, type, and scheduledFor are required.' });
    }

    const reminder = await Reminder.create({ activity, type, scheduledFor, status: 'pending' });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateReminderStatus = async (req, res) => {
  try {
    const status = req.body?.status?.trim();
    if (!status || !['sent', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'status must be sent or pending.' });
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updatedReminder) {
      return res.status(404).json({ message: 'Reminder not found.' });
    }

    res.json(updatedReminder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    const title = req.body?.title?.trim();
    const message = req.body?.message?.trim();

    if (!title || !message) {
      return res.status(400).json({ message: 'title and message are required.' });
    }

    const users = await User.find({ role: 'employee' }).select('email').lean();
    const emails = users.map((user) => user.email).filter(Boolean);

    if (!emails.length) {
      return res.json({ sent: 0 });
    }

    await Promise.all(emails.map((to) => sendEmail({ action: 'broadcast', title, message, to })));

    res.json({ sent: emails.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendReminderNow = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found.' });
    }

    const activity = await Activity.findOne({ name: reminder.activity }).select(
      'name serviceType scheduleDate scheduleTime location',
    );
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found.' });
    }

    const registrations = await Registration.find({ activityId: activity._id })
      .populate({ path: 'employeeId', select: 'email' })
      .lean();

    const emails = registrations
      .map((registration) => registration.employeeId?.email)
      .filter(Boolean);

    if (!emails.length) {
      return res.json({ sent: 0 });
    }

    await Promise.all(
      emails.map((to) =>
        sendEmail({
          action: 'reminder',
          activity: reminder.activity,
          scheduleDate: activity.scheduleDate,
          scheduleTime: activity.scheduleTime,
          location: activity.location,
          serviceType: activity.serviceType,
          to,
        }),
      ),
    );

    const updatedReminder = await Reminder.findByIdAndUpdate(
      reminder._id,
      { status: 'sent' },
      { new: true, runValidators: true },
    );

    res.json({ sent: emails.length, reminder: updatedReminder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listReminders,
  createReminder,
  updateReminderStatus,
  sendBroadcast,
  sendReminderNow,
};
