// pantypost-backend/models/DigitalContent.js

/* Paid digital content: a photo a buyer unlocks once and keeps.
 *
 * The thing that makes this work is where the two files live. The
 * BLURRED preview sits in uploads/ and is served statically like any
 * other image -- it is meant to be seen. The ORIGINAL sits in
 * private-media/, outside the static mount, and is streamed only by a
 * route that checks the caller has paid.
 *
 * Blurring in CSS would have been simpler and completely useless: the
 * original would still be in the page, one DevTools panel away. The
 * blur has to be baked into a separate file, and the real file has to
 * be unreachable without permission. Everything else here follows from
 * that.
 */

const mongoose = require('mongoose');

const digitalContentSchema = new mongoose.Schema({
  seller: {
    type: String,
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },

  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },

  /* What the buyer pays, and what the buyer sees. No markup: the
     seller sets $10 and the price reads $10, unlike physical listings
     where the buyer pays a marked-up figure. Digital costs us nothing
     to deliver, so the 5% comes out of the seller's side and the
     headline number stays honest. */
  price: {
    type: Number,
    required: true,
    min: 1,
    max: 500
  },

  /* Public. Blurred at upload, served from uploads/ like any image. */
  previewUrl: {
    type: String,
    required: true
  },

  /* Private. A path under private-media/, never a URL -- there is no
     URL that reaches it. Stored relative so moving the directory does
     not orphan every row. */
  originalPath: {
    type: String,
    required: true,
    select: false
  },

  /* How hard the preview is blurred. Recorded so the seller can see
     what they chose and so a regenerate knows what to reproduce; the
     actual blur is already baked into previewUrl. */
  blurLevel: {
    type: String,
    enum: ['light', 'medium', 'heavy'],
    default: 'medium'
  },

  mimeType: { type: String, default: 'image/webp' },
  fileSize: { type: Number, default: 0 },

  // Moderation, the same gate every other piece of content passes.
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
    index: true
  },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  denialReason: { type: String, default: '' },

  isActive: { type: Boolean, default: true, index: true },

  // Counters, kept on the document so a card does not need a join.
  purchaseCount: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 }
}, { timestamps: true });

digitalContentSchema.index({ seller: 1, createdAt: -1 });
digitalContentSchema.index({ approvalStatus: 1, isActive: 1, createdAt: -1 });

/** Blur strength per level, as a sharp sigma. */
digitalContentSchema.statics.BLUR_SIGMA = {
  /* Light still conceals detail. A preview that merely softens the
     image gives the content away and nobody pays for what they can
     already see -- which hurts the seller, not us. */
  light: 12,
  medium: 24,
  heavy: 40
};

/* Our cut. Half the physical rate, because delivering a file costs us
   bandwidth and nothing else -- no escrow, no shipping dispute, no
   chargeback window on an item that never arrives. */
digitalContentSchema.statics.PLATFORM_FEE_RATE = 0.05;

module.exports = mongoose.model('DigitalContent', digitalContentSchema);
