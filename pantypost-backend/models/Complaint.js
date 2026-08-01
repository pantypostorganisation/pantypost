// pantypost-backend/models/Complaint.js
//
// Public complaints and content removal requests.
//
// This is deliberately SEPARATE from the Report model. Reports are
// user-to-user, require an account, and feed the ban workflow.
// Complaints must be accepted from ANYONE — including people with no
// account who believe they have been depicted without consent — and
// carry a published resolution deadline.
//
// Merging the two would compromise both: reports would gain anonymous
// submissions they were not designed for, and complaints would inherit
// a login requirement that defeats their purpose.

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Complaint categories.
 *
 * The first two are treated as urgent: content is removed from public
 * view immediately on receipt and reviewed afterwards, rather than
 * waiting for the standard review window.
 */
const COMPLAINT_TYPES = [
  'non_consensual_content', // depicted without consent — immediate removal
  'underage_content',       // suspected minor — immediate removal, highest priority
  'illegal_content',
  'copyright',
  'impersonation',
  'privacy',
  'harassment',
  'other',
];

/** Types that trigger immediate removal pending review. */
const URGENT_TYPES = ['non_consensual_content', 'underage_content'];

const STATUSES = ['received', 'under_review', 'action_taken', 'dismissed', 'escalated'];

const complaintSchema = new mongoose.Schema({
  // Human-readable reference so a complainant with no account can
  // follow up on their submission.
  referenceCode: {
    type: String,
    unique: true,
    index: true,
  },

  complaintType: {
    type: String,
    enum: COMPLAINT_TYPES,
    required: true,
    index: true,
  },

  // ---- Complainant ----
  // Name is optional: someone reporting non-consensual imagery of
  // themselves should not be forced to identify further than they wish.
  complainantName: {
    type: String,
    maxlength: 200,
    default: '',
  },
  // Required, since a resolution must be communicated back.
  complainantEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 320,
  },
  // Populated only when the complainant happened to be logged in.
  complainantUsername: {
    type: String,
    default: null,
  },

  // ---- Subject of the complaint ----
  contentUrl: {
    type: String,
    maxlength: 2000,
    default: '',
  },
  contentType: {
    type: String,
    enum: ['listing', 'post', 'profile', 'gallery_image', 'message', 'other'],
    default: 'other',
  },
  contentId: {
    type: String,
    default: null,
  },
  reportedUser: {
    type: String,
    default: null,
    index: true,
  },

  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },

  // Declaration that the complainant is the person depicted. Central to
  // the consent-violation appeal route.
  declaresDepicted: {
    type: Boolean,
    default: false,
  },

  // ---- Handling ----
  status: {
    type: String,
    enum: STATUSES,
    default: 'received',
    index: true,
  },
  priority: {
    type: String,
    enum: ['standard', 'urgent', 'critical'],
    default: 'standard',
    index: true,
  },

  // Whether the content was pulled from public view on receipt.
  contentRemovedOnReceipt: {
    type: Boolean,
    default: false,
  },

  // ---- Resolution tracking ----
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  // Published commitment: five business days from receipt.
  dueBy: {
    type: Date,
    index: true,
  },
  resolvedAt: Date,
  resolutionSummary: {
    type: String,
    maxlength: 2000,
  },
  actionTaken: {
    type: String,
    enum: [
      'content_removed',
      'content_restored',
      'account_suspended',
      'account_banned',
      'warning_issued',
      'no_action_required',
      'referred_to_authorities',
      null,
    ],
    default: null,
  },
  handledBy: String,

  // Full audit trail. Required to evidence that complaints are actually
  // investigated rather than merely received.
  auditLog: [{
    at: { type: Date, default: Date.now },
    by: String,
    action: String,
    note: String,
  }],

  // Retained for abuse prevention only.
  submitterIp: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

complaintSchema.index({ status: 1, priority: -1, receivedAt: 1 });
complaintSchema.index({ dueBy: 1, status: 1 });

/**
 * Add N business days to a date, skipping Saturdays and Sundays.
 * Public holidays are not accounted for; the commitment is expressed
 * in business days and this errs toward the earlier deadline.
 */
function addBusinessDays(startDate, days) {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }
  return result;
}

/** Generate a reference like PP-2026-K7X9M2. */
function generateReferenceCode() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `PP-${year}-${random}`;
}

complaintSchema.pre('validate', function(next) {
  if (!this.referenceCode) {
    this.referenceCode = generateReferenceCode();
  }
  if (!this.receivedAt) {
    this.receivedAt = new Date();
  }
  if (!this.dueBy) {
    this.dueBy = addBusinessDays(this.receivedAt, 5);
  }
  // Urgent categories are escalated automatically rather than relying
  // on a reviewer noticing.
  if (URGENT_TYPES.includes(this.complaintType)) {
    this.priority = this.complaintType === 'underage_content' ? 'critical' : 'urgent';
  }
  next();
});

complaintSchema.methods.addAudit = function(by, action, note) {
  this.auditLog.push({ at: new Date(), by, action, note });
  return this;
};

complaintSchema.methods.isOverdue = function() {
  if (['action_taken', 'dismissed'].includes(this.status)) return false;
  return this.dueBy && new Date() > this.dueBy;
};

/**
 * Monthly figures for the compliance report that must be sent to the
 * payment processor. Returns zeroed counts for a quiet month, which is
 * itself a required submission.
 */
complaintSchema.statics.getMonthlyReport = async function(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const complaints = await this.find({
    receivedAt: { $gte: start, $lt: end },
  }).lean();

  const byType = {};
  const byAction = {};
  let resolvedWithinSla = 0;
  let resolvedOutsideSla = 0;
  let totalResolutionHours = 0;
  let resolvedCount = 0;

  for (const c of complaints) {
    byType[c.complaintType] = (byType[c.complaintType] || 0) + 1;
    if (c.actionTaken) {
      byAction[c.actionTaken] = (byAction[c.actionTaken] || 0) + 1;
    }
    if (c.resolvedAt) {
      resolvedCount += 1;
      totalResolutionHours += (new Date(c.resolvedAt) - new Date(c.receivedAt)) / 36e5;
      if (new Date(c.resolvedAt) <= new Date(c.dueBy)) resolvedWithinSla += 1;
      else resolvedOutsideSla += 1;
    }
  }

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    totalReceived: complaints.length,
    // A month with no complaints still requires a submission.
    isZeroIncidentReport: complaints.length === 0,
    byType,
    byAction,
    resolved: resolvedCount,
    outstanding: complaints.length - resolvedCount,
    resolvedWithinSla,
    resolvedOutsideSla,
    averageResolutionHours: resolvedCount
      ? Math.round((totalResolutionHours / resolvedCount) * 10) / 10
      : 0,
    urgentReceived: complaints.filter(c => URGENT_TYPES.includes(c.complaintType)).length,
    contentRemovedOnReceipt: complaints.filter(c => c.contentRemovedOnReceipt).length,
    generatedAt: new Date(),
  };
};

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
module.exports.COMPLAINT_TYPES = COMPLAINT_TYPES;
module.exports.URGENT_TYPES = URGENT_TYPES;
module.exports.addBusinessDays = addBusinessDays;