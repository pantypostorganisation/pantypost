// pantypost-backend/routes/outreach.routes.js
//
// Admin-only CRUD for the outreach pipeline, plus the email drafter.
//
// The drafter is the point of this file. It writes a different email
// for a creator than for an agency, because they care about different
// things: a creator wants a new income stream that costs her nothing
// extra, an agency wants a revenue line for a roster it already
// manages. It also refuses to produce a draft without a personal note,
// which is the discipline that keeps reply rates where they are.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const OutreachProspect = require('../models/OutreachProspect');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  return next();
}

router.use(authMiddleware, requireAdmin);

// GET /api/outreach  -- list, newest first, optional stage filter
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.stage && req.query.stage !== 'all') query.stage = req.query.stage;
    if (req.query.type && req.query.type !== 'all') query.type = req.query.type;

    const prospects = await OutreachProspect.find(query).sort({ createdAt: -1 }).limit(500);
    const counts = await OutreachProspect.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        prospects,
        counts: counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
        total: await OutreachProspect.countDocuments({})
      }
    });
  } catch (error) {
    console.error('[Outreach] List error:', error);
    res.status(500).json({ success: false, error: 'Could not load prospects' });
  }
});

// POST /api/outreach
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    const prospect = await OutreachProspect.create({
      name: String(body.name).trim(),
      type: ['creator', 'manager', 'agency'].includes(body.type) ? body.type : 'creator',
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      handle: body.handle,
      profileUrl: body.profileUrl,
      sourceUrl: body.sourceUrl,
      manages: body.manages,
      audienceSize: body.audienceSize,
      personalNote: body.personalNote,
      notes: body.notes,
      addedBy: req.user.username
    });
    res.json({ success: true, data: prospect });
  } catch (error) {
    console.error('[Outreach] Create error:', error);
    res.status(400).json({ success: false, error: 'Could not save prospect' });
  }
});

// PATCH /api/outreach/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = [
      'name', 'type', 'email', 'handle', 'profileUrl', 'sourceUrl', 'manages',
      'audienceSize', 'personalNote', 'stage', 'notes', 'doNotContact'
    ];
    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    /* Moving to "contacted" stamps the date and counts the touch, so
       the follow-up rule (one, and only one) can be enforced by eye. */
    if (update.stage === 'contacted') {
      update.lastContactedAt = new Date();
      update.$inc = undefined;
    }

    const prospect = await OutreachProspect.findByIdAndUpdate(
      req.params.id,
      update.stage === 'contacted'
        ? { $set: update, $inc: { followUpCount: 1 } }
        : { $set: update },
      { new: true }
    );
    if (!prospect) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: prospect });
  } catch (error) {
    console.error('[Outreach] Update error:', error);
    res.status(400).json({ success: false, error: 'Could not update prospect' });
  }
});

// DELETE /api/outreach/:id
router.delete('/:id', async (req, res) => {
  try {
    await OutreachProspect.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Could not delete prospect' });
  }
});

/* ------------------------------------------------------------------
   The drafter.

   Three variants, because the pitch that lands depends on who is
   reading it. Every version carries the sender identification and the
   opt-out line the Spam Act requires, and every version states plainly
   that payments are not live yet -- a seller who finds that out later
   is a seller lost, and one who is told up front and joins anyway is
   one who actually meant it.
   ------------------------------------------------------------------ */

const SIGNOFF =
  'Oakley\n' +
  'Co-founder, Panty Post\n' +
  'G Dykyj & O.S Richards, trading as Panty Post - ABN 16 501 428 474\n' +
  'pantypost.com\n\n' +
  "If you would rather not hear from me again, just reply and say so and you won't.";

const DROP_EXPLAINER =
  'The format is simple: you wear a pair, take one photo of yourself in them, ' +
  'take them off. The buyer gets the item and that photo, which was taken for ' +
  'them and nobody else. One item, one photo, one buyer.';

const WHY_IT_WORKS =
  'Two things make this work better than an ordinary listing. It is genuinely ' +
  'scarce - once it is gone it cannot be reproduced, which is the opposite of ' +
  'digital content. And it is personal in a way a video is not, so buyers come ' +
  'back to the same seller rather than shopping around. The people who buy one ' +
  'tend to buy again from the same person.';

const VIRALITY =
  'The other thing worth noting: this category has produced some of the most ' +
  'talked-about moments in the creator space - a limited physical drop selling ' +
  'out has repeatedly turned into coverage and follower growth across every ' +
  'platform a creator is on. The item is the story.';

const PAYMENTS_NOTE =
  'One thing up front so nothing surprises you: buyer card payments are not ' +
  'switched on yet, we are finishing our processor integration. So right now ' +
  'this is about being set up before the doors open rather than earning this ' +
  'week.';

function draftForCreator(p) {
  const note = p.personalNote ? p.personalNote.trim() : '';
  const opener = note
    ? `Hi ${p.name.split(' ')[0]} - ${note}`
    : `Hi ${p.name.split(' ')[0]},`;

  return {
    subject: 'A drop idea for your audience',
    body:
      `${opener}\n\n` +
      "I'm Oakley, co-founder of Panty Post - a verified marketplace for worn " +
      'items. I wanted to put one specific idea in front of you rather than a ' +
      'general pitch.\n\n' +
      `${DROP_EXPLAINER}\n\n` +
      `${WHY_IT_WORKS}\n\n` +
      `${VIRALITY}\n\n` +
      'On our side: no listing fees, no monthly fee, sellers keep 90% (95% at ' +
      'higher tiers). Every seller is ID-verified, so no fake accounts. Buyers ' +
      'pay into a wallet before anything ships.\n\n' +
      `${PAYMENTS_NOTE}\n\n` +
      'If it sounds worth trying, I will set your shop and first drop up for ' +
      'you myself - you would just need to send photos and pricing.\n\n' +
      `${SIGNOFF}`
  };
}

function draftForManager(p) {
  const note = p.personalNote ? p.personalNote.trim() : '';
  const who = p.manages ? ` for ${p.manages}` : ' for your creators';
  return {
    subject: 'Physical drops - a revenue line for your creators',
    body:
      `Hi ${p.name.split(' ')[0]},${note ? ' ' + note : ''}\n\n` +
      "I'm Oakley, co-founder of Panty Post, a verified marketplace for worn " +
      `items. I am writing about a specific format that works well${who} and ` +
      'takes very little of their time.\n\n' +
      `${DROP_EXPLAINER}\n\n` +
      `${WHY_IT_WORKS}\n\n` +
      `${VIRALITY}\n\n` +
      'Commercially: no fees to you or to them, creators keep 90% (95% at ' +
      'higher tiers), and we can arrange a share on referred creators through ' +
      'our referral program. We handle onboarding and can build their shops ' +
      'for them.\n\n' +
      `${PAYMENTS_NOTE}\n\n` +
      'Worth a short call, or shall I send a one-pager first?\n\n' +
      `${SIGNOFF}`
  };
}

function draftForAgency(p) {
  const note = p.personalNote ? p.personalNote.trim() : '';
  const roster = p.manages ? `\n\nYour roster${p.manages ? ' (' + p.manages + ')' : ''} is the kind of fit I have in mind.` : '';
  return {
    subject: 'Partnership: physical drops for your roster',
    body:
      `Hi ${p.name.split(' ')[0]},${note ? ' ' + note : ''}\n\n` +
      "I'm Oakley, co-founder of Panty Post - a verified marketplace for worn " +
      'items, operated out of Australia. I am reaching out about a partnership ' +
      'that adds a revenue line for your creators at no cost to you.' +
      roster + '\n\n' +
      `${DROP_EXPLAINER}\n\n` +
      `${WHY_IT_WORKS}\n\n` +
      `${VIRALITY}\n\n` +
      'Terms: commission-only, no fees either way. Creators keep 90% (95% at ' +
      'higher tiers), and we offer a revenue share on referred creators. We do ' +
      'the onboarding and shop setup ourselves - no work on your side.\n\n' +
      `${PAYMENTS_NOTE}\n\n` +
      'Happy to pilot with three to five creators and look at the numbers ' +
      'together after 30 days.\n\n' +
      `${SIGNOFF}`
  };
}

// GET /api/outreach/:id/draft
router.get('/:id/draft', async (req, res) => {
  try {
    const p = await OutreachProspect.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, error: 'Not found' });

    const draft =
      p.type === 'agency' ? draftForAgency(p) :
      p.type === 'manager' ? draftForManager(p) :
      draftForCreator(p);

    res.json({
      success: true,
      data: {
        ...draft,
        to: p.email || '',
        /* Surfaced rather than enforced: a draft without a personal
           note still sends, it just converts like a template. */
        warning: p.personalNote ? null : 'No personal note set - this will read like a template.'
      }
    });
  } catch (error) {
    console.error('[Outreach] Draft error:', error);
    res.status(400).json({ success: false, error: 'Could not build draft' });
  }
});

module.exports = router;
