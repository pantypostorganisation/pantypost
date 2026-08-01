// pantypost-backend/utils/moderation.js
//
// Shared pre-publication moderation logic.
//
// Every piece of user-generated content on the platform (listings,
// posts, profile images, gallery images) must be reviewed by an
// administrator before it becomes publicly visible. This module is the
// single place that decides what "pending", "approved" and "denied"
// mean, so the rules cannot drift apart between content types.
//
// Two rules matter most and are easy to get wrong:
//
//   1. FAIL CLOSED. Content is only ever public when it has been
//      explicitly approved. Missing or unrecognised state is treated as
//      not-approved, never as approved.
//
//   2. EDITS RE-ENTER REVIEW. Approving a listing approves the content
//      that was reviewed, not the listing forever. If a seller later
//      changes the images or wording, it returns to the queue.
//      Without this, moderation is trivially defeated by publishing
//      acceptable content and swapping it afterwards.

const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
};

// Changing any of these fields on a listing means buyers would see
// something different from what the reviewer saw.
const MATERIAL_LISTING_FIELDS = ['title', 'description', 'tags', 'imageUrls'];

// Same principle for social/Explore posts.
const MATERIAL_POST_FIELDS = ['content', 'imageUrls'];

/**
 * Normalise a value for comparison purposes.
 * Arrays are compared by their contents, not by reference, so that
 * re-submitting an identical array is not treated as a change.
 */
function normaliseForComparison(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((v) => (v === null || v === undefined ? '' : String(v))));
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Decide whether an incoming update materially changes reviewed content.
 *
 * @param {object} existing   The current stored document.
 * @param {object} incoming   The request body.
 * @param {string[]} fields   Which fields count as material.
 * @returns {boolean}
 */
function hasMaterialChange(existing, incoming, fields) {
  if (!existing || !incoming) return false;

  return fields.some((field) => {
    if (incoming[field] === undefined) return false; // not being changed
    return normaliseForComparison(existing[field]) !== normaliseForComparison(incoming[field]);
  });
}

/**
 * Put a document into the review queue.
 * Used on creation and whenever reviewed content is materially edited.
 *
 * @param {object} target  A Mongoose document or plain object.
 * @param {string} reason  Optional audit note, e.g. 'edited by seller'.
 */
function markPending(target, reason) {
  target.approvalStatus = MODERATION_STATUS.PENDING;
  target.requiresApproval = true;
  target.approvedAt = undefined;
  target.approvedBy = undefined;
  target.deniedAt = undefined;
  target.deniedBy = undefined;
  target.denialReason = undefined;
  if (reason) {
    target.moderationNote = reason;
  }
  return target;
}

/**
 * Mark a document as approved and publicly visible.
 *
 * @param {object} target
 * @param {string} adminUsername  Who approved it, for the audit trail.
 */
function markApproved(target, adminUsername) {
  target.approvalStatus = MODERATION_STATUS.APPROVED;
  target.requiresApproval = false;
  target.approvedAt = new Date();
  target.approvedBy = adminUsername;
  target.deniedAt = undefined;
  target.deniedBy = undefined;
  target.denialReason = undefined;
  return target;
}

/**
 * Mark a document as denied. It stays out of public view.
 *
 * @param {object} target
 * @param {string} adminUsername
 * @param {string} reason  Shown to the content owner.
 */
function markDenied(target, adminUsername, reason) {
  target.approvalStatus = MODERATION_STATUS.DENIED;
  target.requiresApproval = true;
  target.deniedAt = new Date();
  target.deniedBy = adminUsername;
  target.denialReason = reason || undefined;
  target.approvedAt = undefined;
  target.approvedBy = undefined;
  return target;
}

/**
 * Build the MongoDB condition that restricts a query to publicly
 * visible content.
 *
 * This deliberately lists only the approved state. Earlier versions
 * also treated "field missing" and "requiresApproval is not true" as
 * visible, which meant any document created outside the main creation
 * path was public by default.
 *
 * @param {object}  options
 * @param {string}  options.viewerUsername  Owner may see their own pending content.
 * @param {string}  options.ownerField      Schema field holding the owner's username.
 * @param {boolean} options.isAdmin         Admins see everything.
 * @returns {object} A MongoDB query fragment, or null when unrestricted.
 */
function buildVisibilityFilter({ viewerUsername, ownerField = 'seller', isAdmin = false } = {}) {
  if (isAdmin) return null; // admins are not restricted

  const conditions = [{ approvalStatus: MODERATION_STATUS.APPROVED }];

  // Creators can always see their own submissions, including items
  // still awaiting review or that were denied, so they can fix them.
  if (viewerUsername) {
    conditions.push({ [ownerField]: viewerUsername });
  }

  return { $or: conditions };
}

/**
 * Mongoose schema fragment shared by every moderated collection.
 * Defaults fail closed: new content is pending until reviewed.
 */
const moderationSchemaFields = {
  approvalStatus: {
    type: String,
    enum: [MODERATION_STATUS.PENDING, MODERATION_STATUS.APPROVED, MODERATION_STATUS.DENIED],
    default: MODERATION_STATUS.PENDING,
    index: true,
  },
  requiresApproval: {
    type: Boolean,
    default: true,
  },
  approvedAt: Date,
  approvedBy: String,
  deniedAt: Date,
  deniedBy: String,
  denialReason: String,
  moderationNote: String,
};

module.exports = {
  MODERATION_STATUS,
  MATERIAL_LISTING_FIELDS,
  MATERIAL_POST_FIELDS,
  hasMaterialChange,
  markPending,
  markApproved,
  markDenied,
  buildVisibilityFilter,
  moderationSchemaFields,
};