const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
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
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listUsers,
  createUser,
};
