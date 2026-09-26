// pantypost-backend/models/PaymentStats.js
const mongoose = require('mongoose');

const PaymentStatsSchema = new mongoose.Schema({
  // Genuine transaction-derived total. Never use this field for display-only adjustments.
  totalPaymentsProcessed: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Optional display-only adjustment for the homepage hero counter.
  // When enabled, the public counter is relabelled "Promotional counter"
  // so this amount is never presented as genuine processed payment volume.
  heroDisplayAdjustment: {
    type: Number,
    default: 0,
    min: 0,
  },
  heroDisplayAdjustmentEnabled: {
    type: Boolean,
    default: false,
  },
  heroDisplayAdjustmentUpdatedAt: {
    type: Date,
    default: null,
  },
  heroDisplayAdjustmentUpdatedBy: {
    type: String,
    default: null,
    trim: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PaymentStats', PaymentStatsSchema);
