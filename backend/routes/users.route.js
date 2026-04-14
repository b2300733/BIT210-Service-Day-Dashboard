const express = require('express');
const router = express.Router();
const {
  listUsers,
  createUser,
  getUserByEmail,
  loginUser,
} = require('../controllers/users.controller');

router.get('/', listUsers);
router.get('/by-email', getUserByEmail);
router.post('/', createUser);
router.post('/login', loginUser);

module.exports = router;
