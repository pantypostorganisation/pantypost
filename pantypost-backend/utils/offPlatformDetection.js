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

/* ==================================================================
 * PAYMENT SOLICITATION
 *
 * Stricter than the above, and this one BLOCKS.
 *
 * The distinction is between a mention and an instrument. "I don't use
 * PayPal, let's keep it on the site" is a seller protecting herself,
 * and stopping her from saying it would be absurd. "$myhandle" or a
 * wallet address is not a mention -- it is the means to take a payment
 * off-platform, and there is no version of posting one that serves
 * anybody here.
 *
 * It matters more for the SELLER than for us. An off-platform buyer
 * has her address, her items and no reason to pay; the platform she
 * left is the only thing that was holding him to the deal. Every
 * marketplace in this category has sellers who learned that once.
 * ================================================================== */

/* Identifiers with no innocent reading. Each of these is something a
   buyer could pay to, or a seller could be paid at, and none of them
   has a use in a conversation about a listing. */
const PAYMENT_IDENTIFIERS = [
  /* Must contain a letter. "$450 for two pairs" is a price, and
     treating it as a Cash App tag would block ordinary haggling. */
  { pattern: /\$(?=[a-z0-9_]{3,20}\b)[a-z0-9_]*[a-z][a-z0-9_]*\b/i, label: 'Cash App tag' },
  { pattern: /paypal\.me\/[a-z0-9_.-]+/i,                 label: 'PayPal.me link' },
  { pattern: /venmo\.com\/[a-z0-9_.-]+/i,                 label: 'Venmo link' },
  { pattern: /cash\.app\/[a-z0-9$_.-]+/i,                 label: 'Cash App link' },
  { pattern: /throne\.(me|com)\/[a-z0-9_.-]+/i,           label: 'Throne wishlist' },
  { pattern: /amazon\.[a-z.]{2,6}\/.*\/wishlist|amzn\.to\//i, label: 'Amazon wishlist' },
  /* Two formats. Legacy addresses exclude the ambiguous characters
     0, O, I and l; bech32 (bc1...) uses its own charset that DOES
     include l, so one pattern covering both missed every modern
     address -- which is most of them. */
  { pattern: /\bbc1[a-z0-9]{25,62}\b/i,                   label: 'Bitcoin address' },
  { pattern: /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/,       label: 'Bitcoin address' },
  { pattern: /\b0x[a-f0-9]{40}\b/i,                       label: 'Ethereum address' },
  { pattern: /\bT[1-9A-HJ-NP-Za-km-z]{33}\b/,             label: 'Tron address' },
  { pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, label: 'Email address' },
];

/* Services whose NAME plus an invitation is enough. Naming one is not
   an offence; naming one while asking to be paid there is. */
const PAYMENT_SERVICES =
  /cashapp|venmo|paypal|zelle|wise|revolut|chime|skrill|payoneer|westernunion|moneygram|remitly|applepay|googlepay|giftcard|amazongift|steamcard|throne/;

const PAYMENT_INVITATIONS = [
  /\b(send|pay|transfer|deposit|wire)\s+(it\s+)?(to|me|via|through|using|on)\b/i,
  /\b(my|the)\s+(cashapp|venmo|paypal|zelle|wallet|handle|tag|address)\b/i,
  /\b(pay|send)\s+me\s+(on|through|via|at)\b/i,
  /\bgift\s*card\b/i,
  /\b(outside|off|away from)\s+(the\s+)?(site|platform|app)\b/i,
  /\bavoid\s+(the\s+)?fees?\b/i,
  /\bno\s+fees?\b/i,
];

/**
 * Decides whether a message is trying to take payment off-platform.
 *
 * `block` means refuse to send it. `flag` means let it through and
 * raise it for review. The difference is whether an actual payment
 * instrument is present, not how suspicious the wording sounds.
 */
function detectPaymentSolicitation(content) {
  const text = String(content || '');
  if (!text.trim()) return { block: false, flag: false, reasons: [] };

  const variants = normalise(text);
  const reasons = [];

  /* Our own domain first, so a seller linking her own listing is not
     mistaken for an external payment link. */
  const withoutOwnLinks = text.replace(/https?:\/\/(www\.)?pantypost\.com\S*/gi, '');

  PAYMENT_IDENTIFIERS.forEach(({ pattern, label }) => {
    if (pattern.test(withoutOwnLinks)) reasons.push(label);
  });

  const namesService = variants.some((variant) => PAYMENT_SERVICES.test(variant));
  const invites = PAYMENT_INVITATIONS.some((pattern) => pattern.test(text));

  /* An identifier is enough on its own. A service name needs an
     invitation alongside it, so declining to use one stays sayable. */
  const block = reasons.length > 0 || (namesService && invites);

  if (namesService) reasons.push('Payment service named');

  return {
    block,
    flag: reasons.length > 0,
    reasons,
    // Blocked attempts are the ones worth looking at first.
    severity: block ? 'high' : 'medium'
  };
}

module.exports = { detectOffPlatform, detectPaymentSolicitation, normalise };
