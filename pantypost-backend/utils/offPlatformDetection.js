// pantypost-backend/utils/offPlatformDetection.js

/* Spots attempts to move a conversation off the platform.
 *
 * This is the thing that quietly kills a marketplace: a buyer and a
 * seller meet here, agree terms on Telegram, and the next ten sales
 * happen somewhere we never see. The seller loses our escrow and
 * verification, the buyer loses any recourse, and we lose the sale we
 * made possible.
 *
 * It FLAGS, it does not block. Three reasons:
 *
 *  - "I don't use Telegram, let's keep it here" is a seller doing
 *    exactly the right thing, and a blocker would stop her saying it.
 *  - Evasion is trivial. tg, t3legram, "tele" + "gram" on two lines.
 *    Anyone determined gets through, so blocking only catches the
 *    careless while annoying the innocent.
 *  - A flag gives a human the message in context. A block gives
 *    nobody anything, and the pair move off-platform anyway, now
 *    without a record of it.
 *
 * Normalisation handles the common dodges: spacing, dots and dashes
 * between letters, and digit-for-letter swaps. It is not meant to be
 * unbeatable -- it is meant to surface the obvious cases, which is
 * most of them.
 */

/* Collapses the usual evasions so one pattern catches many spellings.
 *
 * Returns TWO strings, because 1 and ! are ambiguous: in "Te1egram"
 * the 1 is an l, in "te1l me" it is an i. Testing both readings costs
 * nothing and catches the case that a single guess misses -- which it
 * did: Te1egr@m normalised to "teiegram" and sailed through. */
function normalise(text) {
  const base = String(text || '')
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't');

  const strip = (value) => value.replace(/[\s._\-*]+/g, '');

  return [
    strip(base.replace(/[1!|]/g, 'i')),
    strip(base.replace(/[1!|]/g, 'l')),
  ];
}

const PLATFORM_PATTERNS = [
  { pattern: /telegram/,            label: 'Telegram' },
  { pattern: /\bt\.?me\b|tdotme/,   label: 'Telegram link' },
  { pattern: /whatsapp|whatsap/,    label: 'WhatsApp' },
  { pattern: /snapchat|snapchatme/, label: 'Snapchat' },
  { pattern: /kikmessenger|\bkik\b/,label: 'Kik' },
  { pattern: /onlyfans|onlyfan/,    label: 'OnlyFans' },
  { pattern: /cashapp|cash\$app/,   label: 'Cash App' },
  { pattern: /venmo/,               label: 'Venmo' },
  { pattern: /paypal/,              label: 'PayPal' },
  { pattern: /zelle/,               label: 'Zelle' },
  { pattern: /wickr/,               label: 'Wickr' },
  { pattern: /signalapp/,           label: 'Signal' },
  { pattern: /discord/,             label: 'Discord' },
];

/* Phrases that turn a mention into an invitation. "My Telegram is
   private" is a statement; "message me on Telegram" is the thing we
   care about. Checked against the ORIGINAL text, since normalising
   removes the spaces these depend on. */
const SOLICITATION_PHRASES = [
  /\b(message|msg|text|hit|dm|add|contact|reach)\s+me\b/i,
  /\b(off|outside)\s+(the\s+)?(platform|site|app)\b/i,
  /\bmy\s+(number|cell|mobile|phone|handle|username)\s+is\b/i,
  /\blet'?s\s+(talk|chat|move|take\s+this)\b/i,
  /\b(cheaper|better\s+price|no\s+fee|without\s+fees?)\b/i,
];

/* Phone numbers. Deliberately conservative: a run of digits is also a
   price, a size, a date or a tracking number, so this wants either
   enough digits to be a real number or an explicit country code. */
const PHONE_PATTERNS = [
  /\+\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
  /\b0\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/,          // Australian mobile
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,             // North American
];

/* URLs, excluding our own. A seller linking her own listing is fine;
   a link anywhere else is the thing we are looking for. */
const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|me|co|link|gg|ly)\b/i;
const OWN_DOMAIN = /pantypost\.com/i;

/**
 * Examines one message.
 *
 * Returns what was found and how confident we are, never a verdict.
 * The caller decides what a flag is worth; this only reports.
 */
function detectOffPlatform(content) {
  const text = String(content || '');
  if (!text.trim()) return { flagged: false, reasons: [], severity: 'low' };

  const variants = normalise(text);
  const reasons = [];

  PLATFORM_PATTERNS.forEach(({ pattern, label }) => {
    if (variants.some((variant) => pattern.test(variant))) reasons.push(label);
  });

  const hasPhone = PHONE_PATTERNS.some((pattern) => pattern.test(text));
  if (hasPhone) reasons.push('Phone number');

  const urlMatch = text.match(URL_PATTERN);
  if (urlMatch && !OWN_DOMAIN.test(urlMatch[0])) {
    reasons.push('External link');
  }

  if (reasons.length === 0) return { flagged: false, reasons: [], severity: 'low' };

  /* A bare mention is weaker evidence than a mention plus an
     invitation. "Do you have Telegram?" and "message me on Telegram,
     it's cheaper" deserve different attention, and an admin reading a
     queue needs to see which is which without opening every one. */
  const solicits = SOLICITATION_PHRASES.some((pattern) => pattern.test(text));

  let severity = 'low';
  if (hasPhone || (reasons.length > 1 && solicits)) severity = 'high';
  else if (solicits || reasons.length > 1) severity = 'medium';

  return { flagged: true, reasons, severity, solicits };
}

module.exports = { detectOffPlatform, normalise };
