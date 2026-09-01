// pantypost-backend/models/PayoutDetails.js
//
// Where a seller's money actually goes.
//
// Kept in its own collection rather than on the User document so that
// ordinary user queries -- profiles, browse pages, seller cards --
// never accidentally carry banking data into a response. The only way
// to read this is to ask for it deliberately.
//
// Stored in full, because a bank transfer cannot be made from a masked
// number. The withdrawal TRANSACTION still records only the last four
// digits; the full details live here and are shown to an admin at the
// moment of paying, and nowhere else.

const mongoose = require('mongoose');

const payoutDetailsSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    method: {
      type: String,
      enum: ['bank_au', 'bank_intl', 'paxum'],
      required: true
    },

    // Shown on the payment so the seller can recognise it.
    accountName: { type: String, required: true, trim: true, maxlength: 140 },

    // Australian domestic
    bsb: { type: String, trim: true, maxlength: 10 },
    accountNumber: { type: String, trim: true, maxlength: 30 },

    // International
    iban: { type: String, trim: true, maxlength: 40 },
    swift: { type: String, trim: true, maxlength: 20 },
    bankName: { type: String, trim: true, maxlength: 140 },
    bankAddress: { type: String, trim: true, maxlength: 300 },
    country: { type: String, trim: true, maxlength: 80 },

    // Paxum and similar e-wallets
    walletEmail: { type: String, trim: true, lowercase: true, maxlength: 200 },

    updatedBy: { type: String, trim: true }
  },
  { timestamps: true }
);

/** Last four digits only -- for lists, receipts and transaction records. */
payoutDetailsSchema.methods.toMasked = function toMasked() {
  const tail = (value) => (value && value.length >= 4 ? '****' + value.slice(-4) : '****');
  return {
    method: this.method,
    accountName: this.accountName,
    summary:
      this.method === 'paxum'
        ? this.walletEmail
        : this.method === 'bank_au'
          ? `BSB ${this.bsb || '---'} / ${tail(this.accountNumber)}`
          : `${this.bankName || 'Bank'} ${tail(this.iban || this.accountNumber)}`,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('PayoutDetails', payoutDetailsSchema);
