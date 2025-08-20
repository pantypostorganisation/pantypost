// src/hooks/seller-settings/useGalleryManagement.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';
import { storageService } from '@/services';
import { securityService } from '@/services/security.service';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { enhancedUsersService } from '@/services/users.service.enhanced';
import { FEATURES, API_BASE_URL } from '@/services/api.config';

const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function useGalleryManagement() {
  const { user, getAuthToken } = useAuth();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const rateLimiter = getRateLimiter();

  // Load gallery images on mount
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (!user?.username) return;
      
      setIsLoading(true);
      try {
        if (FEATURES.USE_API_USERS) {
          // Fetch from API with proper auth token
          const token = getAuthToken();
          const response = await fetch(
            `${API_BASE_URL}/api/users/${encodeURIComponent(user.username)}/gallery`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const images = data.data.galleryImages || [];
              // Validate and sanitize gallery URLs
              const validatedGallery = images
                .map((url: string) => sanitizeUrl(url))
                .filter((url: string | null): url is string => url !== '' && url !== null)
                .slice(0, MAX_GALLERY_IMAGES);
              
              setGalleryImages(validatedGallery);
            }
          }
        } else {
          // Fallback to localStorage
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
      } catch (error) {
        console.error('Error loading gallery images:', error);
        setValidationError('Failed to load gallery images');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGalleryImages();
  }, [user?.username, getAuthToken]);

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

  // Save gallery images to backend
  const saveGalleryToBackend = async (images: string[]): Promise<boolean> => {
    if (!user?.username) return false;

    try {
      if (FEATURES.USE_API_USERS) {
        // Get fresh auth token to prevent session issues
        const token = getAuthToken();
        
        if (!token) {
          console.error('No auth token available');
          setValidationError('Authentication required. Please log in again.');
          return false;
        }
        
        const response = await fetch(
          `${API_BASE_URL}/api/users/${encodeURIComponent(user.username)}/gallery`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'replace', // Replace entire gallery
              images: images
            })
          }
        );

        if (response.status === 401) {
          // Token might be expired, but don't log out the user
          console.error('Auth token expired or invalid');
          setValidationError('Session expired. Please refresh the page.');
          return false;
        }

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to save gallery to backend:', error);
          return false;
        }

        const result = await response.json();
        console.log('Gallery saved to backend:', result);
        
        // Clear the enhanced users service cache to force reload
        enhancedUsersService.clearCache();
        
        return true;
      } else {
        // Fallback to localStorage
        await storageService.setItem(`profile_gallery_${user.username}`, images);
        return true;
      }
    } catch (error) {
      console.error('Error saving gallery to backend:', error);
      return false;
    }
  };

  // Upload gallery images with Cloudinary
  const uploadGalleryImages = async (onSave?: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

    // Check if user is authenticated
    if (!user?.username) {
      setValidationError('Please log in to upload images');
      return;
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
      ...RATE_LIMITS.IMAGE_UPLOAD,
      identifier: user.username
    });

    if (!rateLimitResult.allowed) {
      setValidationError(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
      return;
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
      
      // Save to backend FIRST
      const saveSuccess = await saveGalleryToBackend(updatedGallery);
      
      if (saveSuccess) {
        // Only update local state if backend save was successful
        setGalleryImages(updatedGallery);
        setSelectedFiles([]);
        
        // Call the onSave callback if provided
        if (onSave) {
          onSave(updatedGallery);
        }
        
        console.log('Gallery images uploaded and saved successfully');
      } else {
        setValidationError('Failed to save gallery. Please try again.');
      }
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
  const removeGalleryImage = async (index: number, onSave?: (images: string[]) => void) => {
    if (index < 0 || index >= galleryImages.length) return;
    
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    
    // Save to backend first
    const saveSuccess = await saveGalleryToBackend(updatedGallery);
    
    if (saveSuccess) {
      setGalleryImages(updatedGallery);
      if (onSave) {
        onSave(updatedGallery);
      }
    } else {
      setValidationError('Failed to remove image. Please try again.');
    }
  };

  // Clear all gallery images
  const clearAllGalleryImages = async (onSave?: (images: string[]) => void) => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      // Save empty gallery to backend
      const saveSuccess = await saveGalleryToBackend([]);
      
      if (saveSuccess) {
        setGalleryImages([]);
        if (onSave) {
          onSave([]);
        }
      } else {
        setValidationError('Failed to clear gallery. Please try again.');
      }
    }
  };

  return {
    galleryImages,
    selectedFiles,
    isUploading,
    isLoading,
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