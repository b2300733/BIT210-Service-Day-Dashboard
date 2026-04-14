const express = require('express');
const router = express.Router();
const {
  listRegistrations,
  createRegistration,
  deleteRegistration,
} = require('../controllers/registrations.controller');

router.get('/', listRegistrations);
router.post('/', createRegistration);
router.delete('/', deleteRegistration);

module.exports = router;
