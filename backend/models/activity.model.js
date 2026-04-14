const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  serviceType: { type: String, required: true },
  scheduleDate: { type: String, required: true },
  scheduleTime: { type: String, required: true },
  location: { type: String, required: true },
  registered: { type: Number, default: 0 },
  totalSlots: { type: Number, required: true, min: 1 },
  cutoffDate: { type: String, required: true },
  cutoffTime: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model('Activity', activitySchema);
