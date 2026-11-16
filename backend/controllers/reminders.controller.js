const crypto = require('crypto');
const { query } = require('../db');

let broadcastInFlight = false;
const reminderInFlight = new Set();

const mapReminder = (row) => ({
  _id: row.id,
  activity: row.activity,
  type: row.type,
  scheduledFor: row.scheduled_for,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const sendEmail = async (payload) => {
  if (!process.env.AP_Url) throw new Error('AP_Url is not configured.');
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
  try {
    const [rows] = await query('SELECT * FROM reminders ORDER BY created_at DESC');
    res.json(rows.map(mapReminder));
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const id = crypto.randomUUID();
    await query('INSERT INTO reminders (id, activity, type, scheduled_for) VALUES (?, ?, ?, ?)', [id, activity, type, scheduledFor]);
    const [rows] = await query('SELECT * FROM reminders WHERE id = ?', [id]);
    res.status(201).json(mapReminder(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReminderStatus = async (req, res) => {
  try {
    const status = req.body?.status?.trim();
    if (!['sent', 'pending'].includes(status)) return res.status(400).json({ message: 'status must be sent or pending.' });
    const [result] = await query('UPDATE reminders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Reminder not found.' });
    const [rows] = await query('SELECT * FROM reminders WHERE id = ?', [req.params.id]);
    res.json(mapReminder(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM reminders WHERE id = ?', [req.params.id]);
    const reminder = rows[0];
    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    if (reminder.status === 'sent') return res.status(409).json({ message: 'Sent reminders cannot be deleted.' });
    if (reminderInFlight.has(req.params.id)) return res.status(409).json({ message: 'Reminder is currently sending. Please wait.' });
    await query('DELETE FROM reminders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reminder deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendBroadcast = async (req, res) => {
  try {
    const title = req.body?.title?.trim();
    const message = req.body?.message?.trim();
    if (!title || !message) return res.status(400).json({ message: 'title and message are required.' });
    if (broadcastInFlight) return res.status(429).json({ message: 'Broadcast is already being sent. Please wait.' });
    broadcastInFlight = true;
    const [users] = await query("SELECT email FROM users WHERE role = 'employee' AND email IS NOT NULL");
    await Promise.all(users.map(({ email }) => sendEmail({ action: 'broadcast', title, message, to: email })));
    res.json({ sent: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    broadcastInFlight = false;
  }
};

const sendReminderNow = async (req, res) => {
  const id = req.params.id;
  try {
    if (reminderInFlight.has(id)) return res.status(429).json({ message: 'Reminder is already being sent. Please wait.' });
    const [reminders] = await query('SELECT * FROM reminders WHERE id = ?', [id]);
    const reminder = reminders[0];
    if (!reminder) return res.status(404).json({ message: 'Reminder not found.' });
    if (reminder.status === 'sent') return res.status(409).json({ message: 'Reminder has already been sent.' });
    reminderInFlight.add(id);
    const [activities] = await query('SELECT * FROM activities WHERE name = ?', [reminder.activity]);
    const activity = activities[0];
    if (!activity) return res.status(404).json({ message: 'Activity not found.' });
    const [users] = await query(
      `SELECT u.email FROM registrations r JOIN users u ON u.id = r.employee_id WHERE r.activity_id = ? AND u.email IS NOT NULL`,
      [activity.id],
    );
    await Promise.all(users.map(({ email }) => sendEmail({
      action: 'reminder',
      activity: reminder.activity,
      scheduleDate: activity.schedule_date,
      scheduleTime: activity.schedule_time,
      location: activity.location,
      serviceType: activity.service_type,
      to: email,
    })));
    await query("UPDATE reminders SET status = 'sent' WHERE id = ?", [id]);
    const [updated] = await query('SELECT * FROM reminders WHERE id = ?', [id]);
    res.json({ sent: users.length, reminder: mapReminder(updated[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    reminderInFlight.delete(id);
  }
};

module.exports = {
  listReminders,
  createReminder,
  updateReminderStatus,
  deleteReminder,
  sendBroadcast,
  sendReminderNow,
};
