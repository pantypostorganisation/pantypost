// pantypost-backend/models/PaymentStats.js
const mongoose = require('mongoose');

const PaymentStatsSchema = new mongoose.Schema({
  totalPaymentsProcessed: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PaymentStats', PaymentStatsSchema);
