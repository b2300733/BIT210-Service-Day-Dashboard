const { query } = require('../db');

const mapReminder = (row) => ({
  _id: row.id,
  activity: row.activity,
  type: row.type,
  scheduledFor: row.scheduled_for,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const findAll = async () => {
  const [rows] = await query('SELECT * FROM reminders ORDER BY created_at DESC');
  return rows.map(mapReminder);
};
const findById = async (id) => {
  const [rows] = await query('SELECT * FROM reminders WHERE id = ?', [id]);
  return rows[0] ? mapReminder(rows[0]) : null;
};
const create = async ({ activity, type, scheduledFor, status }) => {
  const [result] = await query(
    'INSERT INTO reminders (activity, type, scheduled_for, status) VALUES (?, ?, ?, ?)',
    [activity, type, scheduledFor, status],
  );
  return findById(result.insertId);
};
const updateStatus = async (id, status) => {
  await query('UPDATE reminders SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
};
const remove = async (id) => {
  const [result] = await query('DELETE FROM reminders WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, updateStatus, remove };
