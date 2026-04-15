const express = require('express');
const router = express.Router();
const {
  listReminders,
  createReminder,
  updateReminderStatus,
  sendBroadcast,
  sendReminderNow,
} = require('../controllers/reminders.controller');

router.get('/', listReminders);
router.post('/', createReminder);
router.post('/broadcast', sendBroadcast);
router.post('/:id/send', sendReminderNow);
router.put('/:id', updateReminderStatus);

module.exports = router;
