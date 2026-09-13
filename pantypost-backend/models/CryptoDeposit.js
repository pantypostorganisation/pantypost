// pantypost-backend/models/CryptoDeposit.js

/* A crypto wallet top-up.
 *
 * Unlike the bank-transfer flow, nothing here needs a human: the
 * blockchain confirms the payment and NOWPayments tells us via a
 * signed webhook. The record exists so we can (a) show the buyer what
 * they owe and to which address, (b) recognise the callback when it
 * arrives, and (c) never credit the same payment twice.
 *
 * Amounts are stored in AUD (what the buyer asked for) AND in the
 * crypto figure quoted at the time, because the rate moves between
 * quote and payment and we need both to reconcile.
 */

const mongoose = require('mongoose');

const cryptoDepositSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },

  // What the buyer asked to top up, in the platform's currency.
  amountAud: { type: Number, required: true, min: 0 },

  // NOWPayments' own id for this invoice -- the key the webhook uses.
  paymentId: { type: String, required: true, unique: true, index: true },

  // What the buyer must send, quoted at creation.
  payAmount: { type: Number, default: null },
  payCurrency: { type: String, default: '' },
  payAddress: { type: String, default: '' },

  /* Some chains (XRP, XLM, BNB) need a memo/tag as well as an address.
     Sending without it loses the payment, so it is stored and shown
     prominently when present. */
  payinExtraId: { type: String, default: null },

  /* Mirrors NOWPayments' own status vocabulary rather than inventing
     one, so a support conversation about a stuck payment can quote the
     same word they use.
       waiting            -> invoice created, nothing received
       confirming         -> seen on chain, not yet final
       confirmed/finished -> settled; wallet credited
       partially_paid     -> underpaid; credited at what arrived
       failed/expired     -> nothing to credit */
  status: {
    type: String,
    enum: ['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'],
    default: 'waiting',
    index: true
  },

  // What actually landed, per the webhook.
  actuallyPaid: { type: Number, default: 0 },

  /* The credit guard. Set once, when the wallet is credited. The
     webhook can fire several times for one payment (confirming, then
     finished), and a retry can replay an old one -- this is what stops
     a double credit. */
  creditedAt: { type: Date, default: null },
  creditedAmountAud: { type: Number, default: null },
  transactionId: { type: mongoose.Schema.Types.ObjectId, default: null },

  // Last raw webhook, kept for support and dispute questions.
  lastWebhook: { type: mongoose.Schema.Types.Mixed, default: null },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    index: true
  }
}, { timestamps: true });

cryptoDepositSchema.index({ username: 1, createdAt: -1 });

module.exports = mongoose.model('CryptoDeposit', cryptoDepositSchema);
