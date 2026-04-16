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
    qrData: {
      type: String,
      trim: true,
      default: null,
    },
    qrGeneratedAt: {
      type: Date,
      default: null,
    },
    qrchecked: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

registrationSchema.index({ employeeId: 1, activityId: 1 }, { unique: true });
registrationSchema.index({ qrData: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Registration', registrationSchema);
