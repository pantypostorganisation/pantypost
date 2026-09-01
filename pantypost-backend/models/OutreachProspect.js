// pantypost-backend/models/OutreachProspect.js
//
// The outreach pipeline: creators, managers and agencies we are
// talking to about drops.
//
// Deliberately NOT a scraped list. Every row is added by hand from a
// contact address the person has published for business enquiries,
// which is what makes the outreach lawful under the Spam Act's
// inferred-consent test -- and it is also what keeps reply rates in
// the 50% range instead of the 1-3% a bulk blast gets. The notes field
// exists to force that: if you cannot write one specific true thing
// about them, the email is not ready to send.

const mongoose = require('mongoose');

const STAGES = ['to_contact', 'contacted', 'replied', 'call_booked', 'onboarding', 'live', 'passed'];

const outreachProspectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: ['creator', 'manager', 'agency'],
      default: 'creator',
      index: true
    },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    handle: { type: String, trim: true, maxlength: 120 },      // @name on X / IG
    profileUrl: { type: String, trim: true, maxlength: 500 },   // where we found them
    sourceUrl: { type: String, trim: true, maxlength: 500 },    // where the email was published

    // For managers/agencies: who they represent. For creators: audience size.
    manages: { type: String, trim: true, maxlength: 500 },
    audienceSize: { type: String, trim: true, maxlength: 60 },

    /* The personalisation hook. One specific, true observation --
       "runs a sock line already", "posts about shipping every Friday".
       Generic compliments read as templates and convert like them. */
    personalNote: { type: String, trim: true, maxlength: 600 },

    stage: { type: String, enum: STAGES, default: 'to_contact', index: true },
    lastContactedAt: { type: Date },
    followUpCount: { type: Number, default: 0 },
    doNotContact: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 2000 },
    addedBy: { type: String, trim: true }
  },
  { timestamps: true }
);

outreachProspectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('OutreachProspect', outreachProspectSchema);
module.exports.STAGES = STAGES;
