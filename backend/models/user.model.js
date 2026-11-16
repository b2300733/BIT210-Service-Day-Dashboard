const { query } = require('../db');

const mapUser = (row) => ({
  _id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  department: row.department,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const findAll = async () => {
  const [rows] = await query('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(mapUser);
};
const findById = async (id) => {
  const [rows] = await query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] ? mapUser(rows[0]) : null;
};
const findByEmail = async (email) => {
  const [rows] = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ? mapUser(rows[0]) : null;
};
const findByRole = async (role) => {
  const [rows] = await query('SELECT * FROM users WHERE role = ?', [role]);
  return rows.map(mapUser);
};
const create = async ({ name, email, passwordHash, department, role = 'employee' }) => {
  const [result] = await query(
    'INSERT INTO users (name, email, password_hash, department, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, department, role],
  );
  return findById(result.insertId);
};

module.exports = { findAll, findById, findByEmail, findByRole, create };
