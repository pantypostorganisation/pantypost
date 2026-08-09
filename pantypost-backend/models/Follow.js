// pantypost-backend/models/Follow.js

const mongoose = require('mongoose');

// =====================================================================
// FOLLOW — a FREE, one-way social follow.
//
// This is deliberately NOT the Subscription model. On this platform a
// subscription is a PAID monthly relationship that unlocks premium
// content; a follow costs nothing and only means "show me this seller's
// posts, and tell me when they drop".
//
// Explore's Follow button used to call the paid subscribe endpoint, so a
// button labelled "Follow" was attempting to charge the buyer's wallet.
// Unexpected charges are the single fastest route to chargebacks, which
// is what terminates adult merchant accounts — hence the split.
//
// The two are complementary: every paying subscriber implicitly follows,
// so the following feed unions both (see post.routes.js).
//
// Strategic note: the free follower list is who gets notified when a
// creator opens a drop. That audience is the point of the feature.
// =====================================================================
const followSchema = new mongoose.Schema(
  {
    // The user doing the following.
    follower: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // The user being followed (a seller).
    following: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

// One row per pair. The unique index is the real guard against double
// follows — two rapid taps race the application-level check, and this
// makes the second one fail at the database instead of creating a
// duplicate that would inflate follower counts.
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Feed lookup: "everyone I follow", newest first.
followSchema.index({ follower: 1, createdAt: -1 });

// Follower count / notification fan-out for a seller.
followSchema.index({ following: 1, createdAt: -1 });

/**
 * Usernames the given user follows.
 */
followSchema.statics.getFollowingUsernames = async function (username) {
  const rows = await this.find({ follower: username }).select('following').lean();
  return rows.map((r) => r.following);
};

/**
 * Follower count for a seller.
 */
followSchema.statics.countFollowers = function (username) {
  return this.countDocuments({ following: username });
};

/**
 * Which of `usernames` the viewer already follows, as a Set — one query
 * for a whole feed page rather than one per card.
 */
followSchema.statics.getFollowedSet = async function (viewer, usernames) {
  if (!viewer || !usernames || usernames.length === 0) return new Set();
  const rows = await this.find({
    follower: viewer,
    following: { $in: usernames },
  })
    .select('following')
    .lean();
  return new Set(rows.map((r) => r.following));
};

const Follow = mongoose.model('Follow', followSchema);

module.exports = Follow;
