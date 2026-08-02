// pantypost-backend/routes/traffic.routes.js
//
// Site-wide traffic analytics.
//
// Kept separate from analytics.routes.js, which is entirely
// seller-scoped and checks for role 'seller' on every endpoint. Traffic
// is a different concern: one public collection endpoint and
// admin-only reporting.

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Rate limit for collection. Generous, since one visitor legitimately
 * produces many pageviews, but bounded so the endpoint cannot be used
 * to flood the collection.
 *
 * Exceeding the limit silently drops the event rather than returning an
 * error — analytics must never interrupt a visitor or appear in their
 * console.
 */
const collectLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => res.status(204).end(),
});

/**
 * Daily-rotating salted hash of the visitor's IP.
 *
 * Because the salt includes the current date, the same visitor produces
 * a different hash tomorrow. We can count uniques within a day without
 * being able to follow anyone across days, and the stored value cannot
 * be reversed to an address.
 */
function getVisitorHash(req) {
  const ip =
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip ||
    '';

  if (!ip) return '';

  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.JWT_SECRET || 'analytics-fallback';

  return crypto
    .createHash('sha256')
    .update(`${ip}|${day}|${secret}`)
    .digest('hex')
    .slice(0, 32);
}

/** Coarse device category. The full user agent is never stored. */
function getDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) return 'mobile';
  if (/mozilla|chrome|safari|firefox|edge/.test(ua)) return 'desktop';
  return 'unknown';
}

/** Hostname only — the source, not the specific page it came from. */
function getReferrerHost(referrer, ownHost) {
  if (!referrer) return '';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (ownHost && host === String(ownHost).replace(/^www\./, '')) return '';
    return host.slice(0, 200);
  } catch {
    return '';
  }
}

/** Query strings can carry search terms, so they are stripped. */
function cleanPath(path) {
  if (typeof path !== 'string') return '/';
  return path.split('?')[0].split('#')[0].slice(0, 300) || '/';
}

/* =====================================================================
 * POST /api/traffic/collect
 *
 * Public and unauthenticated by design — signed-out visitors are the
 * majority of traffic and must be countable.
 * ===================================================================== */
router.post('/collect', collectLimiter, async (req, res) => {
  // Respond before doing any work. The client does not need the result,
  // and a slow write should never delay a page.
  res.status(204).end();

  try {
    const body = req.body || {};
    const type = body.type === 'event' ? 'event' : 'pageview';

    // Identify the visitor only if they happen to be signed in.
    let username = null;
    let role = 'guest';
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        username = decoded.username;
        role = decoded.role || 'user';
      } catch {
        // Invalid token is simply treated as a guest.
      }
    }

    await AnalyticsEvent.create({
      type,
      path: cleanPath(body.path),
      referrerHost: getReferrerHost(body.referrer, req.get('host')),
      sessionId: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : '',
      visitorHash: getVisitorHash(req),
      username,
      role,
      device: getDevice(req.get('user-agent')),
      country: (req.headers['cf-ipcountry'] || '').slice(0, 2).toUpperCase(),
      action: typeof body.action === 'string' ? body.action.slice(0, 60) : undefined,
      category: typeof body.category === 'string' ? body.category.slice(0, 60) : undefined,
      label: typeof body.label === 'string' ? body.label.slice(0, 200) : undefined,
      value: Number.isFinite(body.value) ? body.value : undefined,
    });
  } catch (error) {
    console.error('[Traffic] Collection error:', error.message);
  }
});

/* =====================================================================
 * ADMIN REPORTING
 * ===================================================================== */

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  return next();
}

/** Resolve ?days= into a bounded range. Capped at the 90-day retention. */
function resolveRange(query) {
  const days = Math.min(Math.max(parseInt(query.days) || 7, 1), 90);
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  return { since, until, days };
}

/**
 * GET /api/traffic
 * Everything the dashboard needs, in a single request.
 */
router.get('/', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const { since, until, days } = resolveRange(req.query);

    // Preceding window of equal length, for period-on-period comparison.
    const prevUntil = since;
    const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

    const [summary, previous, series, topPages, topReferrers, devices, countries, signedIn] =
      await Promise.all([
        AnalyticsEvent.getTrafficSummary(since, until),
        AnalyticsEvent.getTrafficSummary(prevSince, prevUntil),
        AnalyticsEvent.getDailySeries(since, until),
        AnalyticsEvent.getTopBy('path', since, until, 10),
        AnalyticsEvent.getTopBy('referrerHost', since, until, 10),
        AnalyticsEvent.getTopBy('device', since, until, 5),
        AnalyticsEvent.getTopBy('country', since, until, 10),
        AnalyticsEvent.countDocuments({
          createdAt: { $gte: since, $lt: until },
          type: 'pageview',
          username: { $ne: null },
        }),
      ]);

    const change = (current, prev) => {
      if (!prev) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 1000) / 10;
    };

    return res.json({
      success: true,
      data: {
        range: { days, since, until },
        summary: {
          ...summary,
          viewsPerSession: summary.sessions
            ? Math.round((summary.pageviews / summary.sessions) * 10) / 10
            : 0,
          signedInViews: signedIn,
          guestViews: Math.max(0, summary.pageviews - signedIn),
        },
        change: {
          pageviews: change(summary.pageviews, previous.pageviews),
          visitors: change(summary.visitors, previous.visitors),
          sessions: change(summary.sessions, previous.sessions),
        },
        series,
        topPages,
        // Direct traffic arrives with an empty referrer.
        topReferrers: topReferrers.map((r) => ({
          ...r,
          key: !r.key || r.key === 'Unknown' ? 'Direct' : r.key,
        })),
        devices,
        countries: countries.filter((c) => c.key && c.key !== 'Unknown'),
      },
    });
  } catch (error) {
    console.error('[Traffic] Report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load traffic data' });
  }
});

/**
 * GET /api/traffic/events
 * Tracked interactions — searches, filters, listing clicks.
 */
router.get('/events', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const { since, until } = resolveRange(req.query);

    const [events, searches] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since, $lt: until }, type: 'event' } },
        { $group: { _id: { action: '$action', category: '$category' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { _id: 0, action: '$_id.action', category: '$_id.category', count: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        {
          $match: {
            createdAt: { $gte: since, $lt: until },
            type: 'event',
            action: 'search',
            label: { $nin: [null, ''] },
          },
        },
        { $group: { _id: '$label', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, term: '$_id', count: 1 } },
      ]),
    ]);

    return res.json({ success: true, data: { events, searches } });
  } catch (error) {
    console.error('[Traffic] Events error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load event data' });
  }
});

module.exports = router;