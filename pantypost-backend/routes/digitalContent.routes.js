// pantypost-backend/routes/digitalContent.routes.js

/* Paid digital content.
 *
 * A seller uploads a photo, sets a price and a blur strength. Buyers
 * see a blurred preview and pay once to unlock the original.
 *
 * Two things govern everything below.
 *
 * The original never has a URL. It lives outside the static mount and
 * is streamed by one route that checks for an unlock row first. Blur
 * in CSS would leave the real image in the page; blur baked into a
 * separate file, with the real file unreachable, is the only version
 * that actually protects anything.
 *
 * And the price the seller sets is the price the buyer pays. Physical
 * listings mark up at checkout; this does not. Our 5% comes off the
 * seller's side, so a $10 photo reads $10 and earns $9.50.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DigitalContent = require('../models/DigitalContent');
const ContentUnlock = require('../models/ContentUnlock');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const {
  processDigitalUpload,
  privatePathFor,
  removeDigitalUpload,
  isAvailable,
  PRIVATE_ROOT
} = require('../utils/privateMedia');

/* This route owns its multer instance rather than borrowing one from
   upload.config. The shared uploadConfigs exports already-built
   middleware, not a multer instance, so uploadConfigs.single('image')
   did not configure anything -- it CALLED a request handler with
   'image' as the request object, which threw at startup and took the
   whole API down with it.
   
   Uploads land in private-media/tmp, outside the static mount, because
   even the few milliseconds before processing finishes is time an
   unblurred original would otherwise be publicly fetchable. */
const multer = require('multer');
const TMP_DIR = path.join(PRIVATE_ROOT, 'tmp');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdir(TMP_DIR, { recursive: true }, (err) => cb(err, TMP_DIR));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}`);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('Images only'));
    }
    cb(null, true);
  }
});

/** Turns multer's own errors into the JSON shape the client expects. */
function handleUploadError(err, req, res, next) {
  if (!err) return next();
  console.error('[DigitalContent] Upload error:', err.message);
  return res.status(400).json({
    success: false,
    error: err.code === 'LIMIT_FILE_SIZE' ? 'That file is over 15MB.' : 'Could not read that file.'
  });
}

const PLATFORM_FEE_RATE = DigitalContent.PLATFORM_FEE_RATE;

function isModerator(user) {
  const role = String(user?.role || '').toLowerCase();
  return role === 'admin' || role === 'moderator';
}

/* ------------------------------------------------------------------
 * POST /api/digital-content
 * Seller uploads a piece of content.
 * ---------------------------------------------------------------- */
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  handleUploadError,
  async (req, res) => {
    try {
      if (String(req.user.role || '').toLowerCase() !== 'seller') {
        return res.status(403).json({ success: false, error: 'Sellers only' });
      }

      /* Verified sellers only, the same gate as every other upload
         that results in publicly visible content. Payment processor
         rules require it and this is the content most likely to be
         looked at. */
      const seller = await User.findOne({ username: req.user.username })
        .select('isVerified verificationStatus')
        .lean();

      const verified = seller?.isVerified || seller?.verificationStatus === 'verified';
      if (!verified) {
        return res.status(403).json({
          success: false,
          error: 'Verify your identity before posting paid content.'
        });
      }

      if (!isAvailable()) {
        return res.status(503).json({ success: false, error: 'Uploads are unavailable right now' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'An image is required' });
      }

      const { title, description, blurLevel } = req.body || {};
      const price = Math.round(Number(req.body.price) * 100) / 100;

      if (!title || !String(title).trim()) {
        return res.status(400).json({ success: false, error: 'A title is required' });
      }
      if (!Number.isFinite(price) || price < 1 || price > 500) {
        return res.status(400).json({ success: false, error: 'Price must be between $1 and $500' });
      }

      const level = ['light', 'medium', 'heavy'].includes(blurLevel) ? blurLevel : 'medium';
      const processed = await processDigitalUpload(req.file, level);

      const content = await DigitalContent.create({
        seller: req.user.username,
        title: String(title).trim(),
        description: String(description || '').trim(),
        price,
        blurLevel: level,
        previewUrl: processed.previewUrl,
        originalPath: processed.originalPath,
        mimeType: processed.mimeType,
        fileSize: processed.fileSize,
        approvalStatus: 'pending'
      });

      // The moderation badge should move now, not on its next poll.
      if (global.webSocketService) {
        global.webSocketService.emitApprovalQueueChanged?.();
      }

      return res.json({
        success: true,
        data: {
          id: content._id,
          title: content.title,
          price: content.price,
          blurLevel: content.blurLevel,
          previewUrl: content.previewUrl,
          approvalStatus: content.approvalStatus
        }
      });
    } catch (error) {
      console.error('[DigitalContent] Create error:', error);
      return res.status(500).json({ success: false, error: 'Could not save that content' });
    }
  }
);

/* ------------------------------------------------------------------
 * GET /api/digital-content?seller=
 * The browsable list. Previews only, never a path to an original.
 * ---------------------------------------------------------------- */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = { approvalStatus: 'approved', isActive: true };
    if (req.query.seller) query.seller = String(req.query.seller).toLowerCase();

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 60);

    const [items, total] = await Promise.all([
      DigitalContent.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DigitalContent.countDocuments(query)
    ]);

    /* Which of these the caller already owns, in one query rather than
       one per card. A buyer scrolling their own unlocked content
       should not see "Unlock for $10" on something they bought. */
    const unlocked = new Set(
      (await ContentUnlock.find({
        buyer: req.user.username,
        content: { $in: items.map((item) => item._id) }
      })
        .select('content')
        .lean()).map((row) => String(row.content))
    );

    return res.json({
      success: true,
      data: {
        items: items.map((item) => ({
          id: item._id,
          seller: item.seller,
          title: item.title,
          description: item.description,
          price: item.price,
          blurLevel: item.blurLevel,
          previewUrl: item.previewUrl,
          purchaseCount: item.purchaseCount,
          createdAt: item.createdAt,
          isUnlocked: unlocked.has(String(item._id)) || item.seller === req.user.username
        })),
        page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('[DigitalContent] List error:', error);
    return res.status(500).json({ success: false, error: 'Could not load content' });
  }
});

/* ------------------------------------------------------------------
 * POST /api/digital-content/:id/unlock
 * Buyer pays. Wallet to wallet, no escrow -- the file is delivered the
 * instant it is paid for, so there is nothing to hold.
 * ---------------------------------------------------------------- */
router.post('/:id/unlock', authMiddleware, async (req, res) => {
  try {
    const buyer = req.user.username;

    const content = await DigitalContent.findOne({
      _id: req.params.id,
      approvalStatus: 'approved',
      isActive: true
    });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    if (content.seller === buyer) {
      return res.status(400).json({ success: false, error: 'This is your own content' });
    }

    const existing = await ContentUnlock.findOne({ content: content._id, buyer });
    if (existing) {
      return res.json({ success: true, data: { alreadyUnlocked: true } });
    }

    const price = content.price;
    const platformFee = Math.round(price * PLATFORM_FEE_RATE * 100) / 100;
    const sellerEarned = Math.round((price - platformFee) * 100) / 100;

    /* Conditional debit: the balance check and the deduction are one
       database operation, so two tabs cannot both pass a check that
       only one of them can afford. */
    const debited = await Wallet.findOneAndUpdate(
      { username: buyer, balance: { $gte: price } },
      { $inc: { balance: -price } },
      { new: true }
    );

    if (!debited) {
      return res.status(400).json({ success: false, error: 'Not enough balance' });
    }

    let unlock;
    try {
      unlock = await ContentUnlock.create({
        content: content._id,
        buyer,
        seller: content.seller,
        pricePaid: price,
        platformFee,
        sellerEarned
      });
    } catch (unlockError) {
      // Put the money back rather than charging for nothing.
      await Wallet.findOneAndUpdate({ username: buyer }, { $inc: { balance: price } });

      // A duplicate means they already owned it; that is not an error.
      if (unlockError.code === 11000) {
        return res.json({ success: true, data: { alreadyUnlocked: true } });
      }
      throw unlockError;
    }

    await Wallet.findOneAndUpdate(
      { username: content.seller },
      { $inc: { balance: sellerEarned }, $setOnInsert: { username: content.seller, role: 'seller' } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const transaction = await Transaction.create({
      type: 'purchase',
      amount: price,
      from: buyer,
      to: content.seller,
      description: `Digital content: ${content.title}`,
      status: 'completed',
      completedAt: new Date(),
      metadata: {
        kind: 'digital_content',
        contentId: String(content._id),
        platformFee,
        sellerEarned
      }
    });

    unlock.transactionId = transaction._id;
    await unlock.save();

    await DigitalContent.updateOne(
      { _id: content._id },
      { $inc: { purchaseCount: 1, totalEarned: sellerEarned } }
    );

    try {
      await Notification.create({
        recipient: content.seller,
        type: 'sale',
        title: 'Content unlocked',
        message: `${buyer} unlocked "${content.title}" — you earned $${sellerEarned.toFixed(2)}.`,
        relatedId: String(content._id),
        relatedType: 'digital_content'
      });
    } catch (notifyError) {
      console.error('[DigitalContent] Notification failed:', notifyError.message);
    }

    try {
      if (global.webSocketService) {
        global.webSocketService.emitBalanceUpdate(buyer, 'buyer', debited.balance + price, debited.balance, 'purchase');
      }
    } catch (wsError) {
      console.error('[DigitalContent] Websocket notify failed:', wsError.message);
    }

    return res.json({
      success: true,
      data: { unlocked: true, balance: debited.balance }
    });
  } catch (error) {
    console.error('[DigitalContent] Unlock error:', error);
    return res.status(500).json({ success: false, error: 'Could not complete that purchase' });
  }
});

/* ------------------------------------------------------------------
 * GET /api/digital-content/:id/media
 *
 * The only way to the original. Everything else in this file exists to
 * make this route's permission check meaningful.
 * ---------------------------------------------------------------- */
router.get('/:id/media', authMiddleware, async (req, res) => {
  try {
    const content = await DigitalContent.findById(req.params.id).select('+originalPath');
    if (!content) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    const viewer = req.user.username;
    const owns = content.seller === viewer;

    let paid = false;
    if (!owns) {
      paid = Boolean(await ContentUnlock.exists({ content: content._id, buyer: viewer }));
    }

    /* Moderators can view to review it. Logged, because the ability to
       open anything on the platform should leave a trail. */
    const moderating = !owns && !paid && isModerator(req.user);
    if (moderating) {
      console.log(`[DigitalContent] Moderator ${viewer} viewed content ${content._id}`);
    }

    if (!owns && !paid && !moderating) {
      return res.status(403).json({ success: false, error: 'Unlock this content to view it' });
    }

    const filePath = privatePathFor(content.originalPath);
    if (!fs.existsSync(filePath)) {
      console.error('[DigitalContent] Missing file for', content._id, filePath);
      return res.status(404).json({ success: false, error: 'File unavailable' });
    }

    /* Private caching only. A shared cache holding this would serve it
       to the next person who asked, which would undo the paywall at
       the CDN rather than in our code. */
    res.setHeader('Content-Type', content.mimeType || 'image/webp');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('[DigitalContent] Media error:', error);
    return res.status(500).json({ success: false, error: 'Could not load that file' });
  }
});

/* ------------------------------------------------------------------
 * GET /api/digital-content/mine -- the seller's own, any status.
 * ---------------------------------------------------------------- */
router.get('/mine/all', authMiddleware, async (req, res) => {
  try {
    const items = await DigitalContent.find({ seller: req.user.username })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      data: items.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        price: item.price,
        blurLevel: item.blurLevel,
        previewUrl: item.previewUrl,
        approvalStatus: item.approvalStatus,
        denialReason: item.denialReason,
        purchaseCount: item.purchaseCount,
        totalEarned: item.totalEarned,
        isActive: item.isActive,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('[DigitalContent] Own list error:', error);
    return res.status(500).json({ success: false, error: 'Could not load your content' });
  }
});

/* ------------------------------------------------------------------
 * DELETE /api/digital-content/:id
 * ---------------------------------------------------------------- */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const content = await DigitalContent.findById(req.params.id).select('+originalPath');
    if (!content) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    if (content.seller !== req.user.username && !isModerator(req.user)) {
      return res.status(403).json({ success: false, error: 'Not yours to delete' });
    }

    /* Deactivated, not destroyed, when someone has paid for it. A
       buyer who unlocked this still owns it, and deleting the file
       would take away something they paid for. */
    if (content.purchaseCount > 0) {
      content.isActive = false;
      await content.save();
      return res.json({ success: true, data: { hidden: true } });
    }

    await removeDigitalUpload(content.originalPath, content.previewUrl);
    await DigitalContent.deleteOne({ _id: content._id });

    return res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[DigitalContent] Delete error:', error);
    return res.status(500).json({ success: false, error: 'Could not delete that' });
  }
});

module.exports = router;
