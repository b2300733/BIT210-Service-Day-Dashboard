const { query } = require('../db');

const mapActivity = (row) => ({
  ...row,
  _id: row.id,
  serviceType: row.service_type,
  scheduleDate: row.schedule_date,
  scheduleTime: row.schedule_time,
  totalSlots: row.total_slots,
  cutoffDate: row.cutoff_date,
  cutoffTime: row.cutoff_time,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findAll = async () => {
  const [rows] = await query('SELECT * FROM activities ORDER BY created_at DESC');
  return rows.map(mapActivity);
};

const findById = async (id) => {
  const [rows] = await query('SELECT * FROM activities WHERE id = ?', [id]);
  return rows[0] ? mapActivity(rows[0]) : null;
};

const create = async (activity) => {
  const [result] = await query(
    `INSERT INTO activities
      (name, service_type, schedule_date, schedule_time, location, total_slots, cutoff_date, cutoff_time, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.name,
      activity.serviceType,
      activity.scheduleDate,
      activity.scheduleTime,
      activity.location,
      activity.totalSlots,
      activity.cutoffDate,
      activity.cutoffTime,
      activity.description,
    ],
  );
  return findById(result.insertId);
};

const update = async (id, activity) => {
  await query(
    `UPDATE activities SET name = ?, service_type = ?, schedule_date = ?, schedule_time = ?,
      location = ?, total_slots = ?, cutoff_date = ?, cutoff_time = ?, description = ?
      WHERE id = ?`,
    [
      activity.name,
      activity.serviceType,
      activity.scheduleDate,
      activity.scheduleTime,
      activity.location,
      activity.totalSlots,
      activity.cutoffDate,
      activity.cutoffTime,
      activity.description,
      id,
    ],
  );
  return findById(id);
};

const incrementRegistered = async (id, amount) => {
  await query('UPDATE activities SET registered = GREATEST(registered + ?, 0) WHERE id = ?', [
    amount,
    id,
  ]);
};

const remove = async (id) => {
  const [result] = await query('DELETE FROM activities WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, findOneByName: async (name) => {
  const [rows] = await query('SELECT * FROM activities WHERE name = ? LIMIT 1', [name]);
  return rows[0] ? mapActivity(rows[0]) : null;
}, create, update, incrementRegistered, remove };
