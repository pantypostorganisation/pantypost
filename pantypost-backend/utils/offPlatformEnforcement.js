// pantypost-backend/utils/offPlatformEnforcement.js
//
// Instant, permanent messaging restriction for named off-platform
// channels.
//
// This is deliberately blunter than utils/offPlatformDetection.js,
// which flags for human review. This one does not weigh intent: if the
// word is in the message, the message does not send, the sender is
// restricted, and a report is filed.
//
// The reason it is blunt is graham24: a buyer who signed up at 03:25,
// sent an identical "hit me up on telegram @tristan_thm" to four
// sellers inside twelve minutes, and reached 36 distinct sellers in
// total. Every one of those messages sent, because flagging does not
// block. Review after the fact is too late when the whole scam fits
// inside a lunch break.
//
// KNOWN AND ACCEPTED CONSEQUENCE: a seller who replies "I don't use
// telegram, let's keep it on here" is restricted too. She is doing the
// right thing and the rule catches her anyway. This was the owner's
// explicit decision, taken twice, with that consequence spelled out.
// The report gives you the full message text, so when it happens you
// can see it was a refusal and lift the restriction -- see
// LIFTING A RESTRICTION in the deploy notes. If the false-positive
// rate turns out to hurt, the fix is to narrow the word list or to
// require a handle alongside the word, not to stop reading reports.

/* Words that trigger an instant permanent restriction.
   Comma-separated, case-insensitive. Add whatsapp, snapchat, kik and
   the rest by setting the env var -- no deploy needed. */
const RESTRICT_WORDS = (process.env.INSTANT_RESTRICT_PLATFORMS || 'telegram')
  .split(',')
  .map((word) => word.trim().toLowerCase().replace(/[^a-z]/g, ''))
  .filter(Boolean);

/* How long the restriction lasts. Permanent by default. Set a number
   of hours to soften it without touching the code. */
const RESTRICT_HOURS = Number(process.env.INSTANT_RESTRICT_HOURS || 0);

/** A date far enough out that the messaging check reads it as permanent. */
const PERMANENT = new Date('2999-12-31T00:00:00Z');

function restrictionUntil() {
  if (RESTRICT_HOURS > 0) {
    return new Date(Date.now() + RESTRICT_HOURS * 60 * 60 * 1000);
  }
  return PERMANENT;
}

/* Collapse the obvious evasions.
 *
 * Spacing and punctuation go entirely, so "t e l e g r a m" and
 * "tele.gram" both come back as "telegram". Digits that stand in for
 * letters are mapped back.
 *
 * Two variants are returned because "1" is ambiguous: it is an l in
 * "te1egram" and an i elsewhere. Checking both costs nothing and
 * closes the cheapest bypass there is. */
function normalise(text) {
  const base = String(text || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/6/g, 'g')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/£/g, 'e');

  const strip = (value) => value.replace(/[^a-z]/g, '');

  return [
    strip(base.replace(/[1!|¡]/g, 'l')),
    strip(base.replace(/[1!|¡]/g, 'i')),
  ];
}

/**
 * Does this message name a restricted channel?
 *
 * @param {string} content
 * @returns {{ restrict: boolean, matched: string[] }}
 */
function detectInstantRestrict(content) {
  if (!content || !RESTRICT_WORDS.length) {
    return { restrict: false, matched: [] };
  }

  const variants = normalise(content);
  const matched = RESTRICT_WORDS.filter((word) =>
    variants.some((variant) => variant.includes(word))
  );

  return { restrict: matched.length > 0, matched };
}

module.exports = {
  detectInstantRestrict,
  restrictionUntil,
  RESTRICT_WORDS,
  RESTRICT_HOURS,
  PERMANENT,
};
