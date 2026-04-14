const express = require('express');
const router = express.Router();
const {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = require('../controllers/activities.controller');

// Get all activities
router.get('/', getActivities);

// Create a new activity
router.post('/', createActivity);

// Update an activity
router.put('/:id', updateActivity);

// Delete an activity
router.delete('/:id', deleteActivity);

module.exports = router;
