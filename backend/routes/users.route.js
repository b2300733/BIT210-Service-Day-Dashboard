const express = require('express');
const router = express.Router();
const { listUsers, createUser } = require('../controllers/users.controller');

router.get('/', listUsers);
router.post('/', createUser);

module.exports = router;
