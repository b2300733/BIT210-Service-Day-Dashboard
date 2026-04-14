const express = require('express');
const router = express.Router();
const {
  listRegistrations,
  listRegistrationsWithActivity,
  createRegistration,
  deleteRegistration,
} = require('../controllers/registrations.controller');

router.get('/', listRegistrations);
router.get('/with-activity', listRegistrationsWithActivity);
router.post('/', createRegistration);
router.delete('/', deleteRegistration);

module.exports = router;
