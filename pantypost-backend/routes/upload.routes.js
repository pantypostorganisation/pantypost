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

      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        url: fileUrl, // convenience
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

      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        url: fileUrl,
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

      // If existing profilePic is local, remove it
      await safeDeleteLocalFromUrl(user.profilePic);

      const fileUrl = getFileUrl(req, req.file.path);
      user.profilePic = fileUrl;
      await user.save();

      return res.json({
        success: true,
        data: { url: fileUrl, filename: req.file.filename, size: req.file.size },
        url: fileUrl,
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
router.post('/listing-images', authMiddleware, (req, res) => {
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
router.post('/gallery', authMiddleware, (req, res) => {
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
      const existing = Array.isArray(user.galleryImages) ? user.galleryImages : [];
      const updated = [...existing, ...newImageUrls].slice(0, 20);

      user.galleryImages = updated;
      await user.save();

      return res.json({
        success: true,
        data: {
          newImages: newImageUrls,
          totalImages: updated.length,
          gallery: updated,
        },
      });
    } catch (error) {
      await Promise.all((req.files || []).map((f) => deleteFile(f.path).catch(() => {})));
      return res.status(500).json({ success: false, error: error.message });
    }
  });
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
