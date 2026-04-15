const express = require('express');
const router = express.Router();
const {
  listRegistrations,
  listRegistrationsWithActivity,
  listRegistrationsWithEmployee,
  createRegistration,
  deleteRegistration,
} = require('../controllers/registrations.controller');

router.get('/', listRegistrations);
router.get('/with-activity', listRegistrationsWithActivity);
router.get('/with-employee', listRegistrationsWithEmployee);
router.post('/', createRegistration);
router.delete('/', deleteRegistration);

module.exports = router;
