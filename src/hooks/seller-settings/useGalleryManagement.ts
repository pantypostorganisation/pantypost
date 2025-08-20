// src/hooks/seller-settings/useGalleryManagement.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';
import { storageService } from '@/services';
import { securityService } from '@/services/security.service';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function useGalleryManagement() {
  const { user } = useAuth();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const rateLimiter = getRateLimiter();

  // Load gallery images on mount
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (user?.username) {
        const storedGallery = await storageService.getItem<string[]>(
          `profile_gallery_${user.username}`,
          []
        );
        
        // Validate and sanitize stored URLs
        const validatedGallery = storedGallery
          .map(url => sanitizeUrl(url))
          .filter((url): url is string => url !== '' && url !== null)
          .slice(0, MAX_GALLERY_IMAGES);
          
        setGalleryImages(validatedGallery);
      }
    };
    loadGalleryImages();
  }, [user?.username]);

  // Clear validation error when files change
  useEffect(() => {
    setValidationError('');
  }, [selectedFiles]);

  // Validate files
  const validateFiles = (files: File[]): { valid: boolean; error?: string } => {
    // Check total number of images
    if (galleryImages.length + files.length > MAX_GALLERY_IMAGES) {
      return { 
        valid: false, 
        error: `Maximum ${MAX_GALLERY_IMAGES} gallery images allowed. You have ${galleryImages.length} images.` 
      };
    }

    // Validate each file
    for (const file of files) {
      const validation = securityService.validateFileUpload(file, {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_IMAGE_TYPES,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });

      if (!validation.valid) {
        return { valid: false, error: validation.error };
      }
    }

    return { valid: true };
  };

  // Handle multiple file selection
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    
    // Validate new files
    const validation = validateFiles(newFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files selected');
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.value = '';
    }
  };

  // Remove selected file before upload
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload gallery images with Cloudinary
  const uploadGalleryImages = async (onSave: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

    // Check rate limit
    if (user?.username) {
      const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
        ...RATE_LIMITS.IMAGE_UPLOAD,
        identifier: user.username
      });

      if (!rateLimitResult.allowed) {
        setValidationError(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
        return;
      }
    }

    // Final validation before upload
    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationError('');
    
    try {
      // Upload to Cloudinary with progress tracking
      const uploadResults = await uploadMultipleToCloudinary(
        selectedFiles,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Extract and validate URLs from upload results
      const newImageUrls = uploadResults
        .map(result => result.url)
        .map(url => sanitizeUrl(url))
        .filter((url): url is string => url !== '' && url !== null);
      
      // Update gallery with new URLs (enforce max limit)
      const updatedGallery = [...galleryImages, ...newImageUrls].slice(0, MAX_GALLERY_IMAGES);
      setGalleryImages(updatedGallery);
      onSave(updatedGallery);
      setSelectedFiles([]);
      setUploadProgress(0);
      
      console.log('Gallery images uploaded successfully:', uploadResults);
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setValidationError(`Failed to upload images: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number, onSave: (images: string[]) => void) => {
    if (index < 0 || index >= galleryImages.length) return;
    
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery);
    onSave(updatedGallery);
  };

  // Clear all gallery images
  const clearAllGalleryImages = (onSave: (images: string[]) => void) => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      setGalleryImages([]);
      onSave([]);
    }
  };

  return {
    galleryImages,
    selectedFiles,
    isUploading,
    uploadProgress,
    validationError,
    multipleFileInputRef,
    maxGalleryImages: MAX_GALLERY_IMAGES,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages
  };
}