const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Monitor name is required'],
      trim: true
    },
    url: {
      type: String,
      required: [true, 'Monitor URL is required'],
      trim: true
    },
    method: {
      type: String,
      enum: ['GET'],
      default: 'GET'
    },
    interval: {
      type: Number,
      default: 5, // minutes
      min: [1, 'Interval must be at least 1 minute']
    },
    timeout: {
      type: Number,
      default: 5000, // milliseconds
      min: [500, 'Timeout must be at least 500ms']
    },
    expectedStatus: {
      type: Number,
      default: 200
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastCheckedAt: {
      type: Date,
      default: null,
      index: true // Indexing lastCheckedAt allows fast querying of due monitors
    },
    currentStatus: {
      type: String,
      enum: ['up', 'down', 'pending'],
      default: 'pending'
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Monitor', monitorSchema);
