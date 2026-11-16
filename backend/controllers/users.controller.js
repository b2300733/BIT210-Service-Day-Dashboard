const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const publicUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
const setAuthCookie = (res, token) => res.cookie('auth_token', token, {
  httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000,
});

const listUsers = async (req, res) => {
  try { res.json((await User.findAll()).map(publicUser)); }
  catch (err) { res.status(500).json({ message: err.message }); }
};
const getUserByEmail = async (req, res) => {
  try {
    const email = req.query.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'email is required.' });
    if (req.user.role !== 'admin' && req.user.email !== email) return res.status(403).json({ message: 'Forbidden.' });
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(publicUser(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const createUser = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    const department = req.body?.department?.trim();
    const role = req.body?.role?.trim() || 'employee';
    if (!name || !email || !password || !department) return res.status(400).json({ message: 'All fields are required.' });
    if (await User.findByEmail(email)) return res.status(409).json({ message: 'Email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), department, role });
    res.status(201).json(publicUser(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const loginUser = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid credentials.' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
    const token = jwt.sign({ _id: String(user._id), email: user.email, role: user.role, name: user.name, department: user.department }, process.env.JWT_SECRET, { expiresIn: '8h' });
    setAuthCookie(res, token);
    res.json(publicUser(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
const getMe = (req, res) => req.user ? res.json(req.user) : res.status(401).json({ message: 'Unauthorized.' });
const logoutUser = (req, res) => { res.clearCookie('auth_token'); res.json({ message: 'Logged out.' }); };

module.exports = { listUsers, createUser, getUserByEmail, loginUser, getMe, logoutUser };
