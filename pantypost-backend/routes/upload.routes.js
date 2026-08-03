// pantypost-backend/routes/upload.routes.js
const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/auth.middleware');
const User = require('../models/User');
const Listing = require('../models/Listing'); // currently unused here, but kept for future-proofing

// Upload utilities (multer configs + helpers)
const {
  uploadConfigs,
  handleUploadError,
  deleteFile,
  getFileUrl,
} = require('../config/upload.config');

/* =======================================================
 * VERIFICATION GATE
 *
 * Uploads that result in publicly visible content are restricted to
 * sellers who have completed identity verification.
 *
 * Payment processor rules require uploads be limited to verified
 * creators. This was previously only a role check, so an unverified
 * seller could upload listing and gallery images freely.
 *
 * Deliberately NOT applied to /verification — that is the route by
 * which a seller becomes verified in the first place.
 * ===================================================== */
async function requireVerifiedSeller(req, res, next) {
  try {
    // Admins are platform staff, not creators, and are not subject to
    // seller verification.
    if (req.user.role === 'admin') return next();

    const user = await User.findOne({ username: req.user.username })
      .select('isVerified verificationStatus')
      .lean();

    const isVerified = Boolean(
      user?.isVerified || user?.verificationStatus === 'verified'
    );

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Identity verification required',
        message: 'You must complete identity verification before uploading images.',
        requiresVerification: true,
      });
    }

    return next();
  } catch (error) {
    console.error('[Upload] Verification check failed:', error.message);
    // Fail closed: an error checking verification must not grant access.
    return res.status(403).json({
      success: false,
      error: 'Could not confirm verification status',
    });
  }
}

/* -------------------------------------------------------
 * Helper: best-effort delete for local files referenced by URL
 * Only deletes if URL contains '/uploads/' and the file exists locally.
 * ----------------------------------------------------- */
async function safeDeleteLocalFromUrl(urlOrPath) {
  try {
    if (!urlOrPath || typeof urlOrPath !== 'string') return;

    if (urlOrPath.includes('/uploads/')) {
      // Extract the local part after /uploads/
      const localRel = urlOrPath.split('/uploads/')[1];
      if (!localRel) return;
      const localPath = path.join('uploads', localRel);
      await deleteFile(localPath).catch(() => {});
    } else if (fs.existsSync(urlOrPath)) {
      // If a raw filesystem path was passed
      await deleteFile(urlOrPath).catch(() => {});
    }
  } catch {
    // swallow
  }
}

/* =======================================================
 * GET /api/upload/test
 * Simple health-check for the upload router.
 * ===================================================== */
router.get('/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Upload routes are working!',
    endpoints: [
      'POST /api/upload                (single file -> returns URL only)',
      'POST /api/upload/single         (single file -> returns URL only)',
      'POST /api/upload/profile-pic    (single file -> updates user.profilePic and returns URL)',
      'POST /api/upload/listing-images (multi file -> returns URLs)',
      'POST /api/upload/verification   (multi field -> returns URLs per field)',
      'POST /api/upload/gallery        (multi file -> stores to user.galleryImages)',
      'DELETE /api/upload/gallery/:index',
    ],
  });
});

/* =======================================================
 * POST /api/upload
 * Generic single-file upload (field: "file") -> returns URL only.
 * No DB mutation; suitable for “upload then save” flows.
 * ===================================================== */
router.post('/', authMiddleware, (req, res) => {
  uploadConfigs.single(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    try {
      const fileUrl = getFileUrl(req, req.file.path);
      const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video/');

      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          isVideo,
        },
        url: fileUrl, // convenience
        isVideo,
      });
    } catch (error) {
      await deleteFile(req.file.path).catch(() => {});
      return res.status(500).json({
        success: false,
        error: error.message || 'Upload failed',
      });
    }
  });
});

/* =======================================================
 * POST /api/upload/single
 * Same as root '/', kept for backward-compat.
 * ===================================================== */
router.post('/single', authMiddleware, (req, res) => {
  uploadConfigs.single(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    try {
      const fileUrl = getFileUrl(req, req.file.path);
      const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video/');

      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          isVideo,
        },
        url: fileUrl,
        isVideo,
      });
    } catch (error) {
      await deleteFile(req.file.path).catch(() => {});
      return res.status(500).json({
        success: false,
        error: error.message || 'Upload failed',
      });
    }
  });
});

/* =======================================================
 * POST /api/upload/profile-pic
 * Upload + immediately persist to the authenticated user's profilePic.
 * (Field: "file")
 * ===================================================== */
router.post('/profile-pic', authMiddleware, (req, res) => {
  uploadConfigs.profilePic(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        await deleteFile(req.file.path).catch(() => {});
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const fileUrl = getFileUrl(req, req.file.path);

      // PRE-PUBLICATION REVIEW
      // The live profilePic is deliberately NOT overwritten here. The
      // new image is queued for admin review and only becomes visible
      // to others once approved.
      //
      // The previous approved image is also NOT deleted, since it must
      // remain in use until the replacement passes review.
      user.submitProfilePicForReview(fileUrl);
      await user.save();

      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          pendingReview: true,
        },
        url: fileUrl,
        pendingReview: true,
        message: 'Profile picture submitted for review. It will be visible to others once approved.',
      });
    } catch (error) {
      await deleteFile(req.file.path).catch(() => {});
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

/* =======================================================
 * POST /api/upload/listing-images
 * Sellers/Admins only. Multi-file upload (field strategy defined
 * in uploadConfigs.listingImages). Returns array of file URLs.
 * ===================================================== */
router.post('/listing-images', authMiddleware, requireVerifiedSeller, (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload listing images',
    });
  }

  uploadConfigs.listingImages(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    try {
      const fileUrls = req.files.map((file) => ({
        url: getFileUrl(req, file.path),
        filename: file.filename,
        size: file.size,
      }));

      return res.json({
        success: true,
        data: { files: fileUrls, count: fileUrls.length },
      });
    } catch (error) {
      // Cleanup on failure
      await Promise.all(
        (req.files || []).map((f) => deleteFile(f.path).catch(() => {}))
      );
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

/* =======================================================
 * POST /api/upload/verification
 * Sellers only. Multi-field upload (defined by uploadConfigs.verification).
 * Returns a map { fieldName: { url, filename, size } }.
 * ===================================================== */
router.post('/verification', authMiddleware, (req, res) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload verification documents',
    });
  }

  uploadConfigs.verification(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    try {
      const uploadedFiles = {};

      for (const fieldname in req.files) {
        const file = req.files[fieldname][0];
        uploadedFiles[fieldname] = {
          url: getFileUrl(req, file.path),
          filename: file.filename,
          size: file.size,
        };
      }

      return res.json({ success: true, data: uploadedFiles });
    } catch (error) {
      // Cleanup on failure
      await Promise.all(
        Object.values(req.files).map(([file]) => deleteFile(file.path).catch(() => {}))
      );
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

/* =======================================================
 * POST /api/upload/gallery
 * Sellers/Admins only. Multi-file. Appends to user.galleryImages
 * (max 20 images retained).
 * ===================================================== */
router.post('/gallery', authMiddleware, requireVerifiedSeller, (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload gallery images',
    });
  }

  uploadConfigs.gallery(req, res, async (err) => {
    if (err) return handleUploadError(err, req, res);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        // cleanup
        await Promise.all((req.files || []).map((f) => deleteFile(f.path).catch(() => {})));
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const newImageUrls = req.files.map((file) => getFileUrl(req, file.path));

      const approved = Array.isArray(user.galleryImages) ? user.galleryImages : [];
      const pending = Array.isArray(user.pendingGalleryImages) ? user.pendingGalleryImages : [];

      // The 20-image cap counts approved and pending together, so the
      // queue cannot be used to sidestep the limit.
      const remainingSlots = Math.max(0, 20 - approved.length - pending.length);
      if (remainingSlots === 0) {
        await Promise.all((req.files || []).map((f) => deleteFile(f.path).catch(() => {})));
        return res.status(400).json({
          success: false,
          error: 'Gallery limit reached (20 images including any awaiting review)',
        });
      }

      const accepted = newImageUrls.slice(0, remainingSlots);

      // Remove any files beyond the cap rather than leaving them on disk.
      if (accepted.length < newImageUrls.length) {
        const rejectedFiles = (req.files || []).slice(accepted.length);
        await Promise.all(rejectedFiles.map((f) => deleteFile(f.path).catch(() => {})));
      }

      // PRE-PUBLICATION REVIEW
      // Images are queued rather than published. galleryImages continues
      // to hold only approved media.
      user.submitGalleryImagesForReview(accepted);
      await user.save();

      return res.json({
        success: true,
        data: {
          newImages: accepted,
          pendingReview: true,
          pendingCount: user.pendingGalleryImages.length,
          totalImages: user.galleryImages.length,
          gallery: user.galleryImages,
        },
        message: 'Images submitted for review. They will appear on your profile once approved.',
      });
    } catch (error) {
      await Promise.all((req.files || []).map((f) => deleteFile(f.path).catch(() => {})));
      return res.status(500).json({ success: false, error: error.message });
    }
  });
});

/* =======================================================
 * DELETE /api/upload/gallery/pending/:id
 * Withdraw an image that is still awaiting review.
 * Approved images are removed via /gallery/:index below.
 * ===================================================== */
router.delete('/gallery/pending/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const pending = Array.isArray(user.pendingGalleryImages) ? user.pendingGalleryImages : [];
    const entry = pending.id(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Pending image not found' });
    }

    const removedUrl = entry.url;
    entry.deleteOne();
    await user.save();

    // Safe to delete from disk: the image was never published.
    await safeDeleteLocalFromUrl(removedUrl);

    return res.json({
      success: true,
      data: {
        removedImage: removedUrl,
        pendingCount: user.pendingGalleryImages.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* =======================================================
 * DELETE /api/upload/gallery/:index
 * Remove indexed image from the authenticated user's gallery.
 * If the image is local (/uploads/...), attempt local delete.
 * ===================================================== */
router.delete('/gallery/:index', authMiddleware, async (req, res) => {
  try {
    const idx = Number.parseInt(req.params.index, 10);

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const gallery = Array.isArray(user.galleryImages) ? user.galleryImages : [];
    if (!Number.isInteger(idx) || idx < 0 || idx >= gallery.length) {
      return res.status(400).json({ success: false, error: 'Invalid image index' });
    }

    const [removed] = gallery.splice(idx, 1);
    user.galleryImages = gallery;
    await user.save();

    await safeDeleteLocalFromUrl(removed);

    return res.json({ success: true, data: { removedImage: removed, gallery } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
