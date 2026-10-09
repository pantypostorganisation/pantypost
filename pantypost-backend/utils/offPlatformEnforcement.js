// pantypost-backend/utils/offPlatformEnforcement.js
//
// Instant, permanent messaging restriction for off-platform channels.
//
// Blunter than utils/offPlatformDetection.js, which flags for human
// review. This one does not weigh intent: if the channel is named, the
// message does not send, the sender is restricted, and a report is
// filed.
//
// WHY: graham24 signed up at 03:25, sent an identical "hit me up on
// telegram @tristan_thm or Snap @graham_thm" to four sellers inside
// twelve minutes, and reached 36 distinct sellers in total. Every one
// of those messages sent, because flagging does not block. Review
// after the fact is useless when the whole scam fits in a lunch break.
//
// TWO TIERS, and the distinction is the whole design:
//
//   BARE words fire on their own. "telegram" anywhere in a message is
//   enough. Only words long and distinctive enough to survive being
//   matched against text with all punctuation removed belong here.
//
//   HANDLE words fire ONLY when attached to an actual handle or an
//   explicit invitation. "snap" is the reason this tier exists: on a
//   site where sellers write "I'll snap a few photos for you" every
//   day, a bare match would permanently restrict them for doing their
//   job. "Snap @graham_thm" restricts; "snap some pics" does not.
//
// KNOWN AND ACCEPTED: a seller replying "I don't use telegram, let's
// keep it on here" is restricted too. She is doing the right thing and
// the bare tier catches her anyway. That was the owner's explicit
// decision, taken twice, with the consequence spelled out. The report
// carries the full message text so the case is visible and quick to
// undo rather than silent.

/* Fire on their own. Must be >= MIN_BARE_LENGTH characters: matching
   happens against text stripped of all punctuation, so a short word
   can be formed accidentally across a word boundary. Anything shorter
   configured here is moved to the handle tier automatically. */
const MIN_BARE_LENGTH = 5;

/* Fire only next to a handle or an invitation. Short, ambiguous, or
   ordinary English words belong here. */
const DEFAULT_BARE = 'telegram,snapchat,whatsapp,wickr';
const DEFAULT_HANDLE = 'snap,kik,tg,sc,ig,wa,insta,viber,signal,session,discord,line,skype,wechat';

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((word) => word.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
}

const configuredBare = parseList(process.env.INSTANT_RESTRICT_PLATFORMS || DEFAULT_BARE);
const configuredHandle = parseList(process.env.INSTANT_RESTRICT_HANDLE_WORDS || DEFAULT_HANDLE);

/* Demote anything too short to match safely on its own. Logged, so a
   word that silently stops behaving the way it was configured is
   visible at boot rather than discovered through a false positive. */
const tooShort = configuredBare.filter((word) => word.length < MIN_BARE_LENGTH);
const BARE_WORDS = configuredBare.filter((word) => word.length >= MIN_BARE_LENGTH);
const HANDLE_WORDS = [...new Set([...configuredHandle, ...tooShort])];

if (tooShort.length) {
  console.warn(
    `[Moderation] These words are under ${MIN_BARE_LENGTH} characters and cannot match ` +
    `safely on their own, so they now require a handle alongside them: ${tooShort.join(', ')}`
  );
}

/* Permanent by default. Set a number of hours to soften it. */
const RESTRICT_HOURS = Number(process.env.INSTANT_RESTRICT_HOURS || 0);
const PERMANENT = new Date('2999-12-31T00:00:00Z');

function restrictionUntil() {
  if (RESTRICT_HOURS > 0) {
    return new Date(Date.now() + RESTRICT_HOURS * 60 * 60 * 1000);
  }
  return PERMANENT;
}

/* Map digits and symbols back to the letters they stand in for. */
function deLeet(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/£/g, 'e')
    .replace(/€/g, 'e');
}

/* Two variants, because "1" is an l in "te1egram" and an i elsewhere.
   Checking both closes the cheapest bypass there is. */
function leetVariants(text) {
  const base = deLeet(text);
  return [
    base.replace(/[1!|¡]/g, 'l'),
    base.replace(/[1!|¡]/g, 'i'),
  ];
}

/* Everything that is not a letter removed, so "t e l e g r a m",
   "tele.gram" and "t-e-l-e-g-r-a-m" all collapse to "telegram". */
function stripped(text) {
  return leetVariants(text).map((variant) => variant.replace(/[^a-z]/g, ''));
}

/* Punctuation collapsed to single spaces, so word boundaries and
   proximity survive for the handle patterns. @ is kept because it is
   the strongest handle signal there is. */
function spaced(text) {
  return leetVariants(text).map((variant) =>
    variant.replace(/[^a-z0-9@_.:=-]+/g, ' ').replace(/\s+/g, ' ').trim()
  );
}

/* A handle word only counts when something handle-shaped sits beside
   it. Each pattern below is a different way people actually write it. */
function handlePatterns(word) {
  const w = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return [
    // snap @graham_thm   |   tg: @name
    new RegExp(`\\b${w}\\b[\\s:=.-]*@[a-z0-9_.]{2,}`),
    // snap: graham_thm   |   ig = name
    new RegExp(`\\b${w}\\b\\s*[:=]\\s*[a-z0-9_.]{3,}`),
    // my snap
    new RegExp(`\\bmy\\s+${w}\\b`),
    // snap is graham   |   ig username
    new RegExp(`\\b${w}\\s+(is|handle|username|user|name|id)\\b`),
    // hit me up on snap   |   dm me on ig
    new RegExp(`\\b(add|hit|dm|msg|message|text|find|contact|reach|chat|talk)\\b[a-z0-9\\s]{0,20}\\bon\\s+${w}\\b`),
  ];
}

/**
 * Does this message name a restricted channel?
 *
 * @param {string} content
 * @returns {{ restrict: boolean, matched: string[], tier: string|null }}
 */
function detectInstantRestrict(content) {
  if (!content) return { restrict: false, matched: [], tier: null };

  const matched = [];

  if (BARE_WORDS.length) {
    const variants = stripped(content);
    for (const word of BARE_WORDS) {
      if (variants.some((variant) => variant.includes(word))) matched.push(word);
    }
  }

  if (matched.length) {
    return { restrict: true, matched, tier: 'named' };
  }

  if (HANDLE_WORDS.length) {
    const variants = spaced(content);
    for (const word of HANDLE_WORDS) {
      const patterns = handlePatterns(word);
      if (variants.some((variant) => patterns.some((pattern) => pattern.test(variant)))) {
        matched.push(word);
      }
    }
  }

  if (matched.length) {
    return { restrict: true, matched, tier: 'handle' };
  }

  return { restrict: false, matched: [], tier: null };
}

/* The copy shown to the person who just got restricted. Firm, specific
   and factual -- it says what happened, that it is on their record,
   and why the rule exists. A vague "message failed" reads as a broken
   site and gets retried; this does not. */
const RESTRICTION_NOTICE = {
  title: 'MESSAGE NOT SENT — YOUR ACCOUNT HAS BEEN RESTRICTED',
  body:
    'You attempted to move this conversation to an outside app.\n\n' +
    'This has been recorded against your account and reported to our moderation team. ' +
    'Your messaging is now disabled.\n\n' +
    'Every scam reported on PantyPost started with a message like yours. Off-platform, ' +
    'there is no escrow, no payment protection and no record — which is exactly why ' +
    'people ask for it.\n\n' +
    'If you believe this was a mistake, email support@pantypost.com with your username. ' +
    'Do not create another account: evading a restriction is a permanent ban.',
};

module.exports = {
  detectInstantRestrict,
  restrictionUntil,
  RESTRICTION_NOTICE,
  BARE_WORDS,
  HANDLE_WORDS,
  RESTRICT_HOURS,
  PERMANENT,
};
