// pantypost-backend/models/AnalyticsEvent.js
//
// First-party traffic analytics.
//
// Deliberately privacy-minimising, for two reasons: this is an adult
// platform where users have a heightened expectation of discretion, and
// our Privacy Policy commits to collecting only what we need.
//
// What is NOT stored:
//   - Raw IP addresses. Only a salted daily hash, used to count unique
//     visitors, which cannot be reversed to an address and rotates
//     every 24 hours so it cannot track anyone across days.
//   - Full user agent strings. Only a coarse device category.
//   - Full referrer URLs. Only the hostname, so we can see that traffic
//     came from Reddit without recording which thread.
//
// Records self-delete after 90 days via a TTL index.

const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pageview', 'event'],
    required: true,
    index: true,
  },

  // Path only — query strings are stripped before storage, since they
  // can contain search terms and other incidental personal data.
  path: {
    type: String,
    required: true,
    maxlength: 300,
    index: true,
  },

  // Hostname only, e.g. 'google.com'. Empty string means direct.
  referrerHost: {
    type: String,
    maxlength: 200,
    default: '',
  },

  // Client-generated, rotates per browser session. Not linked to an
  // account and not persisted beyond the session on the client.
  sessionId: {
    type: String,
    maxlength: 64,
    index: true,
  },

  // Salted daily hash of the IP. Lets us count unique visitors without
  // holding an identifier.
  visitorHash: {
    type: String,
    maxlength: 64,
    index: true,
  },

  // Present only when the visitor happened to be signed in. Traffic
  // from signed-out visitors is entirely anonymous.
  username: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    default: 'guest',
  },

  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown',
  },

  // Two-letter code where the CDN provides one. No finer granularity.
  country: {
    type: String,
    maxlength: 2,
    default: '',
  },

  // Populated for type: 'event' only.
  action: { type: String, maxlength: 60 },
  category: { type: String, maxlength: 60 },
  label: { type: String, maxlength: 200 },
  value: { type: Number },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for the dashboard's most common query shape.
analyticsEventSchema.index({ createdAt: -1, type: 1 });

// Automatic deletion after 90 days. Retention is enforced by the
// database rather than relying on a cleanup job that might not run.
analyticsEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

/**
 * Aggregate traffic for a date range.
 * Returns totals plus the breakdowns the dashboard needs, in one pass.
 */
analyticsEventSchema.statics.getTrafficSummary = async function (since, until) {
  const match = {
    createdAt: { $gte: since, $lt: until },
    type: 'pageview',
  };

  const [totals] = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        pageviews: { $sum: 1 },
        visitors: { $addToSet: '$visitorHash' },
        sessions: { $addToSet: '$sessionId' },
      },
    },
    {
      $project: {
        _id: 0,
        pageviews: 1,
        visitors: { $size: '$visitors' },
        sessions: { $size: '$sessions' },
      },
    },
  ]);

  return totals || { pageviews: 0, visitors: 0, sessions: 0 };
};

/** Pageviews grouped by day, for the trend chart. */
analyticsEventSchema.statics.getDailySeries = async function (since, until) {
  return this.aggregate([
    { $match: { createdAt: { $gte: since, $lt: until }, type: 'pageview' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        pageviews: { $sum: 1 },
        visitors: { $addToSet: '$visitorHash' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        pageviews: 1,
        visitors: { $size: '$visitors' },
      },
    },
    { $sort: { date: 1 } },
  ]);
};

/** Generic "top N by count" helper for pages, referrers, devices etc. */
analyticsEventSchema.statics.getTopBy = async function (field, since, until, limit = 10) {
  return this.aggregate([
    { $match: { createdAt: { $gte: since, $lt: until }, type: 'pageview' } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, key: { $ifNull: ['$_id', 'Unknown'] }, count: 1 } },
  ]);
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;