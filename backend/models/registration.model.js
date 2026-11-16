const { query } = require('../db');

const mapRegistration = (row) => ({
  _id: row.id,
  employeeId: row.employee_id,
  activityId: row.activity_id,
  qrData: row.qr_data,
  qrGeneratedAt: row.qr_generated_at,
  qrchecked: Boolean(row.qr_checked),
  checkedInAt: row.checked_in_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findByEmployee = async (employeeId) => {
  const [rows] = await query('SELECT * FROM registrations WHERE employee_id = ?', [employeeId]);
  return rows.map(mapRegistration);
};
const findByActivity = async (activityId) => {
  const [rows] = await query('SELECT * FROM registrations WHERE activity_id = ?', [activityId]);
  return rows.map(mapRegistration);
};
const findByPair = async (employeeId, activityId) => {
  const [rows] = await query(
    'SELECT * FROM registrations WHERE employee_id = ? AND activity_id = ? LIMIT 1',
    [employeeId, activityId],
  );
  return rows[0] ? mapRegistration(rows[0]) : null;
};
const findByQrData = async (qrData) => {
  const [rows] = await query('SELECT * FROM registrations WHERE qr_data = ? LIMIT 1', [qrData]);
  return rows[0] ? mapRegistration(rows[0]) : null;
};
const create = async (employeeId, activityId) => {
  const [result] = await query(
    'INSERT INTO registrations (employee_id, activity_id) VALUES (?, ?)',
    [employeeId, activityId],
  );
  const [rows] = await query('SELECT * FROM registrations WHERE id = ?', [result.insertId]);
  return mapRegistration(rows[0]);
};
const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.qrData !== undefined) { fields.push('qr_data = ?'); values.push(data.qrData); }
  if (data.qrGeneratedAt !== undefined) { fields.push('qr_generated_at = ?'); values.push(data.qrGeneratedAt); }
  if (data.qrchecked !== undefined) { fields.push('qr_checked = ?'); values.push(data.qrchecked); }
  if (data.checkedInAt !== undefined) { fields.push('checked_in_at = ?'); values.push(data.checkedInAt); }
  if (fields.length) await query(`UPDATE registrations SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
  const [rows] = await query('SELECT * FROM registrations WHERE id = ?', [id]);
  return rows[0] ? mapRegistration(rows[0]) : null;
};
const remove = async (employeeId, activityId) => {
  const [result] = await query(
    'DELETE FROM registrations WHERE employee_id = ? AND activity_id = ?',
    [employeeId, activityId],
  );
  return result.affectedRows > 0;
};
const removeByActivity = async (activityId) => {
  const [result] = await query('DELETE FROM registrations WHERE activity_id = ?', [activityId]);
  return result.affectedRows;
};

module.exports = { findByEmployee, findByActivity, findByPair, findByQrData, create, update, remove, removeByActivity };
