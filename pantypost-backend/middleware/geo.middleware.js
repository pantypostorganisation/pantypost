// pantypost-backend/middleware/geo.middleware.js
//
// Looks up the visitor's country from their IP and enforces the hard
// block. Runs before the routes so a blocked country never reaches an
// endpoint.
//
// Deliberate design decisions:
//
// 1. FAIL OPEN, LOUDLY. If the MaxMind database is missing or fails to
//    load, every request is allowed and a warning is logged every
//    minute. A broken lookup file must never take the whole site down
//    for everyone -- the country dropdown restriction still applies,
//    and the alternative (blocking all traffic on a missing file) is a
//    self-inflicted outage.
//
// 2. The response is a plain 451 with a calm message. It never uses
//    the words "adult" or "pornography": someone in a country where
//    this is criminal could be looking at that screen over a shoulder,
//    and an accusatory page could put them in danger. Same reason we
//    do not suggest using a VPN -- in several blocked countries VPN
//    use is itself a criminal offence.
//
// 3. req.ip is trusted only because server.js sets `trust proxy` to 1
//    (a single nginx hop). If that ever becomes `true`, a client could
//    spoof X-Forwarded-For and choose their own country.

const path = require('path');
const fs = require('fs');
const { isHardBlocked } = require('../config/blockedCountries');

const DB_PATH = process.env.GEOIP_DB_PATH || '/var/lib/GeoIP/GeoLite2-Country.mmdb';

let lookup = null;
let loadFailed = false;
let lastWarnAt = 0;

(async function loadDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      loadFailed = true;
      console.warn('[Geo] GeoIP database not found at ' + DB_PATH + ' -- country blocking is INACTIVE.');
      return;
    }
    const maxmind = require('maxmind');
    lookup = await maxmind.open(DB_PATH, { watchForUpdates: true });
    console.log('[Geo] Country blocking active (database: ' + DB_PATH + ').');
  } catch (err) {
    loadFailed = true;
    console.warn('[Geo] Could not load GeoIP database -- country blocking is INACTIVE:', err.message);
  }
})();

function warnPeriodically() {
  const now = Date.now();
  if (now - lastWarnAt > 60 * 1000) {
    lastWarnAt = now;
    console.warn('[Geo] Country blocking is not active (no GeoIP database).');
  }
}

function countryFromRequest(req) {
  if (!lookup) return null;
  try {
    const result = lookup.get(req.ip);
    return (result && result.country && result.country.iso_code) || null;
  } catch (err) {
    return null;
  }
}

function geoMiddleware(req, res, next) {
  if (loadFailed || !lookup) {
    warnPeriodically();
    req.geoCountry = null;
    return next();
  }

  const country = countryFromRequest(req);
  req.geoCountry = country;

  if (isHardBlocked(country)) {
    return res.status(451).json({
      success: false,
      error: {
        code: 'REGION_UNAVAILABLE',
        message: 'Panty Post is not available in your region. If you believe this is a mistake, contact support@pantypost.com.'
      }
    });
  }

  return next();
}

module.exports = { geoMiddleware, countryFromRequest };
