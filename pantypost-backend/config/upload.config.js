// pantypost-backend/config/upload.config.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/profiles',
  'uploads/listings',
  'uploads/verification',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper function to generate unique filename
const generateFilename = (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${name}-${uniqueSuffix}${ext}`;
};

// Storage configuration for different file types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      cb(null, generateFilename(file));
    }
  });
};

// File filter to only accept images
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Create multer instances for different purposes
const uploadConfigs = {
  // Profile pictures - single file, max 5MB
  profilePic: multer({
    storage: createStorage('uploads/profiles'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }).single('profilePic'),
  
  // Listing images - multiple files, max 10 files, 10MB each
  listingImages: multer({
    storage: createStorage('uploads/listings'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 10 // Max 10 files
    }
  }).array('images', 10),
  
  // Verification documents - multiple specific fields
  verification: multer({
    storage: createStorage('uploads/verification'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB per file
    }
  }).fields([
    { name: 'codePhoto', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
  ]),
  
  // Gallery images for sellers - multiple files
  gallery: multer({
    storage: createStorage('uploads/profiles'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      files: 20 // Max 20 files
    }
  }).array('gallery', 20),
  
  // General single file upload
  single: multer({
    storage: createStorage('uploads/temp'),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  }).single('file')
};

// Error handler middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name'
      });
    }
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
  
  next();
};

// Helper to delete a file
const deleteFile = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper to get file URL - FIXED FOR PRODUCTION
const getFileUrl = (req, filepath) => {
  // Normalize the path (convert backslashes to forward slashes)
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  // Remove 'uploads/' from the beginning if present
  const cleanPath = normalizedPath.replace(/^uploads\//, '');
  
  // CRITICAL FIX: Use the BACKEND_URL from environment
  // This ensures we always return the correct URL regardless of the request origin
  const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  
  // Construct the full URL using the backend URL
  return `${backendUrl}/uploads/${cleanPath}`;
};

module.exports = {
  uploadConfigs,
  handleUploadError,
  deleteFile,
  getFileUrl,
  generateFilename
};