const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    activity: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    scheduledFor: { type: String, required: true, trim: true },
    status: { type: String, enum: ['sent', 'pending'], default: 'pending' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Reminder', reminderSchema);
