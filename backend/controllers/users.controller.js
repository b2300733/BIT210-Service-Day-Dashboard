const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const getJwtSecret = () => process.env.JWT_SECRET;

const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.query.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'email is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (req.user.role !== 'admin' && req.user.email !== email) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const user = await User.findOne({ email }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();
    const department = req.body?.department?.trim();
    const role = req.body?.role?.trim();

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      department,
      ...(role ? { role } : {}),
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const secret = getJwtSecret();
    if (!secret) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured.' });
    }

    const token = jwt.sign(
      {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
      },
      secret,
      { expiresIn: '8h' },
    );

    setAuthCookie(res, token);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  return res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    department: req.user.department,
    role: req.user.role,
  });
};

const logoutUser = async (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', secure: false });
  res.json({ message: 'Logged out.' });
};

module.exports = {
  listUsers,
  createUser,
  getUserByEmail,
  loginUser,
  getMe,
  logoutUser,
};
