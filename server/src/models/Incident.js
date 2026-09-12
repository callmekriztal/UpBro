const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Monitor',
      required: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      required: [true, 'Incident reason is required']
    },
    status: {
      type: String,
      enum: ['ongoing', 'resolved'],
      default: 'ongoing',
      index: true
    },
    durationSeconds: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find ongoing incidents for a specific monitor
incidentSchema.index({ monitorId: 1, status: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
