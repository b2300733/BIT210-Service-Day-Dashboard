require('dotenv').config();
const Reminder = require('../models/reminder.model');
const Activity = require('../models/activity.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');

let broadcastInFlight = false;
const reminderInFlight = new Set();
const sendEmail = async (payload) => {
  if (!process.env.AP_Url) throw new Error('APD_Url is not configured.');
  const response = await fetch(process.env.AP_Url, { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('Email request failed.');
};
const buildScheduledFor = (interval) => {
  const days = { '1-week': 7, '3-day': 3, '1-day': 1 }[interval];
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.toLocaleDateString('en-US')} 05:00 PM`;
};

const listReminders = async (req, res) => {
  try { res.json(await Reminder.findAll()); } catch (err) { res.status(500).json({ message: err.message }); }
};
const createReminder = async (req, res) => {
  try {
    const activity = req.body?.activity?.trim();
    const type = req.body?.type?.trim() || req.body?.interval?.trim();
    const scheduledFor = req.body?.scheduledFor?.trim() || buildScheduledFor(type);
    if (!activity || !type || !scheduledFor) return res.status(400).json({ message: 'activity, type, and scheduledFor are required.' });
    res.status(201).json(await Reminder.create({ activity, type, scheduledFor, status: 'pending' }));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const updateReminderStatus = async (req, res) => {
  try {
    const status = req.body?.status?.trim();
    if (!['sent', 'pending'].includes(status)) return res.status(400).json({ message: 'status must be sent or pending.' });
    const reminder = await Reminder.updateStatus(req.params.id, status);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    res.json(reminder);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    if (reminder.status === 'sent') return res.status(409).json({ message: 'Sent reminders cannot be deleted.' });
    if (reminderInFlight.has(String(reminder._id))) return res.status(409).json({ message: 'Reminder is currently sending. Please wait.' });
    await Reminder.remove(reminder._id);
    res.json({ message: 'Reminder deleted.' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const sendBroadcast = async (req, res) => {
  try {
    const title = req.body?.title?.trim();
    const message = req.body?.message?.trim();
    if (!title || !message) return res.status(400).json({ message: 'title and message are required.' });
    if (broadcastInFlight) return res.status(429).json({ message: 'Broadcast is already being sent. Please wait.' });
    broadcastInFlight = true;
    const emails = (await User.findByRole('employee')).map((user) => user.email).filter(Boolean);
    await Promise.all(emails.map((to) => sendEmail({ action: 'broadcast', title, message, to })));
    res.json({ sent: emails.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
  finally { broadcastInFlight = false; }
};
const sendReminderNow = async (req, res) => {
  const id = String(req.params.id);
  try {
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    if (reminder.status === 'sent') return res.status(409).json({ message: 'Reminder has already been sent.' });
    if (reminderInFlight.has(id)) return res.status(429).json({ message: 'Reminder is already being sent. Please wait.' });
    reminderInFlight.add(id);
    const activity = await Activity.findOneByName(reminder.activity);
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const registrations = await Registration.findByActivity(activity._id);
    const employees = await Promise.all(registrations.map((item) => User.findById(item.employeeId)));
    const emails = employees.map((user) => user?.email).filter(Boolean);
    await Promise.all(emails.map((to) => sendEmail({ action: 'reminder', activity: activity.name,
      scheduleDate: activity.scheduleDate, scheduleTime: activity.scheduleTime, location: activity.location,
      serviceType: activity.serviceType, to })));
    const updatedReminder = await Reminder.updateStatus(id, 'sent');
    res.json({ sent: emails.length, reminder: updatedReminder });
  } catch (err) { res.status(500).json({ message: err.message }); }
  finally { reminderInFlight.delete(id); }
};

module.exports = { listReminders, createReminder, updateReminderStatus, deleteReminder, sendBroadcast, sendReminderNow };
