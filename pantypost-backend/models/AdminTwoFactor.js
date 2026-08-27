// pantypost-backend/models/AdminTwoFactor.js
//
// Short-lived email codes for admin sign-in. One document per pending
// admin login; the TTL index below makes Mongo delete expired codes on
// its own, so nothing lingers. Codes are stored as SHA-256 hashes --
// the plaintext exists only in the email.
// Note: expiresAt is indexed ONLY via schema.index() below -- adding
// index:true on the field as well causes the duplicate-index warnings
// this codebase already suffers elsewhere.

const mongoose = require('mongoose');

const adminTwoFactorSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

adminTwoFactorSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminTwoFactor', adminTwoFactorSchema);
