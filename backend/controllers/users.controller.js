const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');

const publicUser = (row) => ({
  _id: row.id,
  name: row.name,
  email: row.email,
  department: row.department,
  role: row.role,
  createdAt: row.created_at,
});

const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
};

const listUsers = async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, name, email, department, role, created_at FROM users ORDER BY name',
    );
    res.json(rows.map(publicUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.query.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required.' });
    if (req.user.role !== 'admin' && req.user.email !== email) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const [rows] = await query('SELECT id, name, email, department, role, created_at FROM users WHERE email = ?', [email]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
    res.json(publicUser(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    const department = req.body?.department?.trim();
    const role = req.body?.role?.trim() || 'employee';
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return res.status(409).json({ message: 'Email already exists.' });

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (id, name, email, password_hash, department, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, passwordHash, department, role],
    );
    const [rows] = await query('SELECT id, name, email, department, role, created_at FROM users WHERE id = ?', [id]);
    res.status(201).json(publicUser(rows[0]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const [rows] = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
    }

    const token = jwt.sign(
      { _id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );
    setAuthCookie(res, token);
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => res.json({
  _id: req.user._id,
  name: req.user.name,
  email: req.user.email,
  department: req.user.department,
  role: req.user.role,
});

const logoutUser = async (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out.' });
};

module.exports = { listUsers, createUser, getUserByEmail, loginUser, getMe, logoutUser };
