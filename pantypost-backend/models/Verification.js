// pantypost-backend/models/Verification.js
const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: {
    codePhoto: {
      url: String,
      uploadedAt: Date
    },
    idFront: {
      url: String,
      uploadedAt: Date
    },
    idBack: {
      url: String,
      uploadedAt: Date
    },
    passport: {
      url: String,
      uploadedAt: Date
    }
  },
  verificationCode: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  attempts: {
    type: Number,
    default: 1
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
verificationSchema.index({ status: 1, submittedAt: -1 });
verificationSchema.index({ username: 1, status: 1 });

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;