// pantypost-backend/models/AdminAction.js
const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Add indexes for better query performance
adminActionSchema.index({ date: -1 });
adminActionSchema.index({ type: 1 });

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

module.exports = AdminAction;