// pantypost-backend/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { uploadConfigs, handleUploadError, deleteFile, getFileUrl } = require('../config/upload.config');
const User = require('../models/User');
const Listing = require('../models/Listing');
const path = require('path');
const fs = require('fs');

// ============= UPLOAD ROUTES =============

// POST /api/upload/profile-pic - Upload profile picture
router.post('/profile-pic', authMiddleware, (req, res) => {
  uploadConfigs.profilePic(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res);
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    try {
      // Get user
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        // Delete uploaded file
        await deleteFile(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Delete old profile picture if it exists and is stored locally
      if (user.profilePic && user.profilePic.includes('/uploads/')) {
        const oldPath = user.profilePic.split('/uploads/')[1];
        await deleteFile(path.join('uploads', oldPath)).catch(() => {});
      }
      
      // Update user with new profile picture URL
      const fileUrl = getFileUrl(req, req.file.path);
      user.profilePic = fileUrl;
      await user.save();
      
      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size
        }
      });
    } catch (error) {
      // Delete uploaded file on error
      await deleteFile(req.file.path).catch(() => {});
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// POST /api/upload/listing-images - Upload listing images
router.post('/listing-images', authMiddleware, (req, res) => {
  // Only sellers can upload listing images
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload listing images'
    });
  }
  
  uploadConfigs.listingImages(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res);
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    try {
      // Generate URLs for all uploaded files
      const fileUrls = req.files.map(file => ({
        url: getFileUrl(req, file.path),
        filename: file.filename,
        size: file.size
      }));
      
      res.json({
        success: true,
        data: {
          files: fileUrls,
          count: fileUrls.length
        }
      });
    } catch (error) {
      // Delete all uploaded files on error
      for (const file of req.files) {
        await deleteFile(file.path).catch(() => {});
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// POST /api/upload/verification - Upload verification documents
router.post('/verification', authMiddleware, (req, res) => {
  // Only sellers can upload verification docs
  if (req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload verification documents'
    });
  }
  
  uploadConfigs.verification(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res);
    }
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    try {
      const uploadedFiles = {};
      
      // Process each uploaded file
      for (const fieldname in req.files) {
        const file = req.files[fieldname][0];
        uploadedFiles[fieldname] = {
          url: getFileUrl(req, file.path),
          filename: file.filename,
          size: file.size
        };
      }
      
      res.json({
        success: true,
        data: uploadedFiles
      });
    } catch (error) {
      // Delete all uploaded files on error
      for (const fieldname in req.files) {
        const file = req.files[fieldname][0];
        await deleteFile(file.path).catch(() => {});
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// POST /api/upload/gallery - Upload gallery images for sellers
router.post('/gallery', authMiddleware, (req, res) => {
  // Only sellers can upload gallery images
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Only sellers can upload gallery images'
    });
  }
  
  uploadConfigs.gallery(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res);
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }
    
    try {
      // Get user
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        // Delete uploaded files
        for (const file of req.files) {
          await deleteFile(file.path).catch(() => {});
        }
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Generate URLs for uploaded files
      const newImageUrls = req.files.map(file => getFileUrl(req, file.path));
      
      // Add to existing gallery (up to 20 images total)
      const updatedGallery = [...(user.galleryImages || []), ...newImageUrls].slice(0, 20);
      user.galleryImages = updatedGallery;
      await user.save();
      
      res.json({
        success: true,
        data: {
          newImages: newImageUrls,
          totalImages: updatedGallery.length,
          gallery: updatedGallery
        }
      });
    } catch (error) {
      // Delete uploaded files on error
      for (const file of req.files) {
        await deleteFile(file.path).catch(() => {});
      }
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// DELETE /api/upload/gallery/:index - Remove image from gallery
router.delete('/gallery/:index', authMiddleware, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    // Get user
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if index is valid
    if (index < 0 || index >= (user.galleryImages || []).length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image index'
      });
    }
    
    // Get the image URL to delete
    const imageUrl = user.galleryImages[index];
    
    // Remove from array
    user.galleryImages.splice(index, 1);
    await user.save();
    
    // Try to delete the file if it's stored locally
    if (imageUrl && imageUrl.includes('/uploads/')) {
      const filepath = imageUrl.split('/uploads/')[1];
      await deleteFile(path.join('uploads', filepath)).catch(() => {});
    }
    
    res.json({
      success: true,
      data: {
        removedImage: imageUrl,
        gallery: user.galleryImages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/upload/single - General single file upload
router.post('/single', authMiddleware, (req, res) => {
  uploadConfigs.single(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, req, res);
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    try {
      const fileUrl = getFileUrl(req, req.file.path);
      
      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      // Delete uploaded file on error
      await deleteFile(req.file.path).catch(() => {});
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// GET /api/upload/test - Test endpoint to check if uploads are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload routes are working!',
    endpoints: [
      'POST /api/upload/profile-pic',
      'POST /api/upload/listing-images',
      'POST /api/upload/verification',
      'POST /api/upload/gallery',
      'DELETE /api/upload/gallery/:index',
      'POST /api/upload/single'
    ]
  });
});

module.exports = router;