const crypto = require('crypto');
const { pool, query } = require('../db');

const mapActivity = (row) => ({
  _id: row.id,
  name: row.name,
  serviceType: row.service_type,
  scheduleDate: row.schedule_date,
  scheduleTime: row.schedule_time,
  location: row.location,
  registered: row.registered,
  totalSlots: row.total_slots,
  cutoffDate: row.cutoff_date,
  cutoffTime: row.cutoff_time,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const trimPayload = (payload = {}) => ({
  name: payload.name?.trim(),
  serviceType: payload.serviceType?.trim(),
  scheduleDate: payload.scheduleDate?.trim(),
  scheduleTime: payload.scheduleTime?.trim(),
  location: payload.location?.trim(),
  totalSlots: Number(payload.totalSlots),
  cutoffDate: payload.cutoffDate?.trim(),
  cutoffTime: payload.cutoffTime?.trim(),
  description: payload.description?.trim(),
});

const isCutoffPassed = (activity) => {
  const cutoff = new Date(`${activity.cutoff_date}T${activity.cutoff_time}`);
  return !Number.isNaN(cutoff.getTime()) && cutoff < new Date();
};

const getActivities = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM activities ORDER BY schedule_date, schedule_time');
    res.json(rows.map(mapActivity));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createActivity = async (req, res) => {
  try {
    const data = trimPayload(req.body);
    if (
      !data.name ||
      !data.serviceType ||
      !data.scheduleDate ||
      !data.scheduleTime ||
      !data.location ||
      !data.cutoffDate ||
      !data.cutoffTime ||
      !data.description ||
      !Number.isInteger(data.totalSlots) ||
      data.totalSlots < 1
    ) {
      return res.status(400).json({ message: 'All activity fields are required.' });
    }

    const id = crypto.randomUUID();
    await query(
      `INSERT INTO activities
        (id, name, service_type, schedule_date, schedule_time, location, total_slots, cutoff_date, cutoff_time, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.serviceType,
        data.scheduleDate,
        data.scheduleTime,
        data.location,
        data.totalSlots,
        data.cutoffDate,
        data.cutoffTime,
        data.description,
      ],
    );
    const [rows] = await query('SELECT * FROM activities WHERE id = ?', [id]);
    res.status(201).json(mapActivity(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const [existingRows] = await query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: 'Activity not found' });
    if (isCutoffPassed(existing)) {
      return res.status(409).json({ message: 'Activity cutoff has passed.' });
    }

    const data = trimPayload(req.body);
    if (data.totalSlots < existing.registered) {
      return res.status(409).json({
        message: `Total slots cannot be lower than the number of registered employees (${existing.registered}).`,
      });
    }

    await query(
      `UPDATE activities
       SET name = ?, service_type = ?, schedule_date = ?, schedule_time = ?, location = ?,
           total_slots = ?, cutoff_date = ?, cutoff_time = ?, description = ?
       WHERE id = ?`,
      [
        data.name,
        data.serviceType,
        data.scheduleDate,
        data.scheduleTime,
        data.location,
        data.totalSlots,
        data.cutoffDate,
        data.cutoffTime,
        data.description,
        req.params.id,
      ],
    );
    const [rows] = await query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
    res.json(mapActivity(rows[0]));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM activities WHERE id = ?', [req.params.id]);
    const activity = rows[0];
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    if (isCutoffPassed(activity)) {
      return res.status(409).json({ message: 'Activity cutoff has passed.' });
    }

    const [result] = await query('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ message: 'Activity deleted', deletedRegistrations: activity.registered, deletedActivity: result.affectedRows > 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivities, createActivity, updateActivity, deleteActivity };
