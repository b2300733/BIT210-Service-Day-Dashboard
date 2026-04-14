const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

registrationSchema.index({ employeeId: 1, activityId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
