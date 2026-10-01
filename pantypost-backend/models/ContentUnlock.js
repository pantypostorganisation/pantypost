// pantypost-backend/models/ContentUnlock.js

/* Proof that a buyer paid for a piece of digital content.
 *
 * Separate from Order deliberately. An order is a physical thing with
 * a shipping state machine -- pending, shipped, delivered, disputed --
 * and none of that applies to a file that was delivered the instant it
 * was paid for. Forcing digital purchases through that model would
 * mean orders that are permanently "awaiting shipment".
 *
 * This is the row the media route checks before streaming the
 * original. It is the only thing standing between a paid file and
 * anyone who knows its id.
 */

const mongoose = require('mongoose');

const contentUnlockSchema = new mongoose.Schema({
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalContent',
    required: true,
    index: true
  },

  buyer: {
    type: String,
    required: true,
    index: true
  },

  seller: {
    type: String,
    required: true,
    index: true
  },

  /* What was actually paid and how it split, recorded at the time.
     Reading the fee off the content document later would misreport
     every historic purchase the moment a rate changes. */
  pricePaid: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  sellerEarned: { type: Number, required: true },

  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { timestamps: true });

/* One unlock per buyer per item. A double-tap on the buy button would
   otherwise charge twice for something they already own, and refunding
   that is a conversation nobody wants to have. */
contentUnlockSchema.index({ content: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('ContentUnlock', contentUnlockSchema);
