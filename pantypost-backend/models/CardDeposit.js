// pantypost-backend/models/CardDeposit.js

/* A buyer topping up by card through Inqud's on-ramp.
 *
 * The buyer pays by card on Inqud's hosted page; Inqud converts and
 * credits USDC to our account balance. We never see card details and
 * are not the merchant of record for the card transaction.
 *
 * `creditedAt` is the guard that makes this safe to process more than
 * once. The webhook, the buyer's own polling and the admin sweep can
 * all arrive at the same checkout -- whichever gets there first sets
 * this, and the others do nothing.
 */

const mongoose = require('mongoose');

const cardDepositSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },

  // What the buyer asked to add, in USD -- the platform currency.
  amountUsd: { type: Number, required: true, min: 0 },

  // Ours, sent to Inqud so a checkout can be traced back here.
  clientOrderId: { type: String, required: true, unique: true, index: true },

  // Inqud's id for the checkout (ORCO-...). Absent until created.
  checkoutId: { type: String, default: null, index: true, sparse: true },

  // Where the buyer goes to pay.
  onRampUrl: { type: String, default: '' },

  /* Mirrors Inqud's own status words rather than inventing a parallel
     vocabulary, so a support conversation about a stuck payment can
     quote the same term they use. */
  status: {
    type: String,
    enum: ['NEW', 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
    default: 'NEW',
    index: true
  },

  // What Inqud reports actually arrived, once settled.
  targetAmount: { type: Number, default: null },
  targetCurrency: { type: String, default: '' },
  platformFee: { type: Number, default: null },

  creditedAt: { type: Date, default: null },
  creditedAmountUsd: { type: Number, default: null },
  transactionId: { type: mongoose.Schema.Types.ObjectId, default: null },

  // Last raw callback, kept for support questions.
  lastWebhook: { type: mongoose.Schema.Types.Mixed, default: null },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000)
  }
}, { timestamps: true });

cardDepositSchema.index({ username: 1, createdAt: -1 });
cardDepositSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CardDeposit', cardDepositSchema);
