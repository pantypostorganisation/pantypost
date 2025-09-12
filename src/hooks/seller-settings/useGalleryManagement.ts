// src/hooks/seller-settings/useGalleryManagement.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';
import { storageService } from '@/services';
import { securityService } from '@/services/security.service';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { usersService } from '@/services/users.service';

const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

type AllowedMime = typeof ALLOWED_IMAGE_TYPES[number];

function isAllowedType(type: string): type is AllowedMime {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function useGalleryManagement() {
  const { user } = useAuth();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const rateLimiter = getRateLimiter();
  const mountedRef = useRef(true);

  // Keep track of unmount to avoid state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load gallery images (Backend first; LocalStorage fallback for legacy)
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (!user?.username) return;

      try {
        // Prefer backend as source of truth (single-argument signature)
        const profileRes = await usersService.getUserProfile(user.username);

        if (profileRes.success && profileRes.data) {
          const validatedGallery = (profileRes.data.galleryImages || [])
            .map((u) => sanitizeUrl(u))
            .filter((u): u is string => !!u)
            .slice(0, MAX_GALLERY_IMAGES);

          if (mountedRef.current) setGalleryImages(validatedGallery);
          return;
        }
      } catch {
        // fall back below
      }

      // Legacy fallback: LocalStorage (read-only). We do not write to LocalStorage anymore.
      try {
        const storedGallery = await storageService.getItem<string[]>(
          `profile_gallery_${user.username}`,
          []
        );

        const validatedGallery = (storedGallery || [])
          .map((u) => sanitizeUrl(u))
          .filter((u): u is string => !!u)
          .slice(0, MAX_GALLERY_IMAGES);

        if (mountedRef.current) setGalleryImages(validatedGallery);
      } catch {
        if (mountedRef.current) setGalleryImages([]);
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
    if (galleryImages.length + files.length > MAX_GALLERY_IMAGES) {
      return {
        valid: false,
        error: `Maximum ${MAX_GALLERY_IMAGES} gallery images allowed. You have ${galleryImages.length} images.`
      };
    }

    for (const file of files) {
      // Size
      if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File "${file.name}" exceeds 10MB limit.` };
      }
      // MIME
      if (!isAllowedType(file.type)) {
        return { valid: false, error: `Unsupported type for "${file.name}". Allowed: JPG, PNG, WEBP.` };
      }
      // Extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        return { valid: false, error: `Invalid extension for "${file.name}".` };
      }
    }

    return { valid: true };
  };

  // Handle multiple file selection
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validation = validateFiles(newFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files selected');
      if (multipleFileInputRef.current) multipleFileInputRef.current.value = '';
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (multipleFileInputRef.current) multipleFileInputRef.current.value = '';
  };

  // Remove selected file before upload
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload gallery images with Cloudinary
  const uploadGalleryImages = async (onSave: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

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

    const validation = validateFiles(selectedFiles);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationError('');

    try {
      const uploadResults = await uploadMultipleToCloudinary(
        selectedFiles,
        (progress) => setUploadProgress(Math.max(0, Math.min(100, Math.round(progress))))
      );

      const newImageUrls = uploadResults
        .map((r) => r?.url)
        .map((u) => sanitizeUrl(u))
        .filter((u): u is string => !!u);

      const updatedGallery = [...galleryImages, ...newImageUrls].slice(0, MAX_GALLERY_IMAGES);
      if (mountedRef.current) {
        setGalleryImages(updatedGallery);
        setSelectedFiles([]);
        setUploadProgress(0);
      }
      onSave(updatedGallery);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setValidationError(`Failed to upload images: ${msg}`);
    } finally {
      if (mountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Remove gallery image (client state only; caller must persist via onSave)
  const removeGalleryImage = (index: number, onSave: (images: string[]) => void) => {
    if (index < 0 || index >= galleryImages.length) return;
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery);
    onSave(updatedGallery);
  };

  // Clear all gallery images (client state only; caller must persist via onSave)
  const clearAllGalleryImages = (onSave: (images: string[]) => void) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to remove all gallery images?')) return;
    setGalleryImages([]);
    onSave([]);
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
