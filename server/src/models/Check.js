const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true
    },
    statusCode: {
      type: Number
    },
    responseTime: {
      type: Number // in milliseconds
    },
    success: {
      type: Boolean,
      required: true
    },
    error: {
      type: String
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound index for querying recent check history per monitor efficiently
checkSchema.index({ monitorId: 1, checkedAt: -1 });

module.exports = mongoose.model('Check', checkSchema);
