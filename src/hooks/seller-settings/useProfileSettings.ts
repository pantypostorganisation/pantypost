// src/hooks/seller-settings/useProfileSettings.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { useProfileSave } from './useProfileSave';
import { useTierCalculation } from './useTierCalculation';
import { storageService } from '@/services';
import { API_BASE_URL, buildApiUrl } from '@/services/api.config';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

const MAX_GALLERY_IMAGES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function useProfileSettings() {
  const { user, token } = useAuth();
  const rateLimiter = getRateLimiter();
  
  // Profile data management
  const profileData = useProfileData();
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  // Profile save management - pass gallery images to the hook
  const { saveSuccess, saveError, isSaving, handleSave: baseSaveProfile, handleSaveWithGallery } = useProfileSave();
  
  // Tier calculation
  const tierData = useTierCalculation();
  
  // State for tier modal
  const [selectedTierDetails, setSelectedTierDetails] = useState<any>(null);

  // Load gallery images on mount from backend
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (user?.username && token) {
        try {
          // Use proper buildApiUrl with params
          const response = await fetch(buildApiUrl('/users/:username/profile', { username: user.username }), {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Handle both direct data and nested profile structure
              const userData = data.data.profile || data.data;
              
              if (userData.galleryImages && Array.isArray(userData.galleryImages)) {
                const validatedGallery = userData.galleryImages
                  .map((url: string) => {
                    // Handle both relative and absolute URLs
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                      return url;
                    } else if (url.startsWith('/uploads/')) {
                      // Convert relative upload paths to full URLs
                      return `${API_BASE_URL}${url}`;
                    } else {
                      return sanitizeUrl(url);
                    }
                  })
                  .filter((url: string | null): url is string => url !== '' && url !== null)
                  .slice(0, MAX_GALLERY_IMAGES);
                
                setGalleryImages(validatedGallery);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load gallery images from backend:', error);
          // Fallback to localStorage
          const storedGallery = await storageService.getItem<string[]>(
            `profile_gallery_${user.username}`,
            []
          );
          
          const validatedGallery = storedGallery
            .map(url => sanitizeUrl(url))
            .filter((url): url is string => url !== '' && url !== null)
            .slice(0, MAX_GALLERY_IMAGES);
            
          setGalleryImages(validatedGallery);
        }
      }
    };
    
    loadGalleryImages();
  }, [user?.username, token]);

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

  // Internal async upload function
  const uploadGalleryImagesAsync = async () => {
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

    setGalleryUploading(true);
    setUploadProgress(0);
    setValidationError('');
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      // IMPORTANT: Backend expects 'images' (plural) for gallery endpoint
      selectedFiles.forEach(file => {
        formData.append('images', file);  // Changed from 'gallery' to 'images'
      });

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(buildApiUrl('/upload/gallery'), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type - let browser set it for FormData
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Extract URLs from response and convert relative paths to full URLs
        const newGallery = (result.data.gallery || []).map((url: string) => {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          } else if (url.startsWith('/uploads/')) {
            return `${API_BASE_URL}${url}`;
          } else {
            return url;
          }
        });
        
        setGalleryImages(newGallery);
        setSelectedFiles([]);
        setUploadProgress(100);
        
        // Also save to localStorage as backup
        if (user?.username) {
          await storageService.setItem(`profile_gallery_${user.username}`, newGallery);
        }
        
        console.log('Gallery images uploaded successfully:', result.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setValidationError(`Failed to upload images: ${errorMessage}`);
    } finally {
      setGalleryUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Wrapped upload function that returns void
  const uploadGalleryImages = () => {
    // Call async function but don't return the promise
    uploadGalleryImagesAsync();
  };

  // Internal async remove function
  const removeGalleryImageAsync = async (index: number) => {
    if (index < 0 || index >= galleryImages.length) return;
    
    try {
      const response = await fetch(buildApiUrl(`/upload/gallery/${index}`), {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove image');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Update with gallery returned from backend, converting URLs
        const updatedGallery = (result.data.gallery || []).map((url: string) => {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          } else if (url.startsWith('/uploads/')) {
            return `${API_BASE_URL}${url}`;
          } else {
            return url;
          }
        });
        
        setGalleryImages(updatedGallery);
        
        // Update localStorage
        if (user?.username) {
          await storageService.setItem(`profile_gallery_${user.username}`, updatedGallery);
        }
      }
    } catch (error) {
      console.error('Failed to remove image:', error);
      // Fallback to local removal
      const updatedGallery = galleryImages.filter((_, i) => i !== index);
      setGalleryImages(updatedGallery);
      
      if (user?.username) {
        await storageService.setItem(`profile_gallery_${user.username}`, updatedGallery);
      }
    }
  };

  // Wrapped remove function that returns void
  const removeGalleryImage = (index: number) => {
    // Call async function but don't return the promise
    removeGalleryImageAsync(index);
  };

  // Internal async clear function
  const clearAllGalleryImagesAsync = async () => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      try {
        // Remove all images one by one from backend
        for (let i = galleryImages.length - 1; i >= 0; i--) {
          await fetch(buildApiUrl(`/upload/gallery/${i}`), {
            method: 'DELETE',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
        }
        
        setGalleryImages([]);
        
        // Clear localStorage
        if (user?.username) {
          await storageService.setItem(`profile_gallery_${user.username}`, []);
        }
      } catch (error) {
        console.error('Failed to clear gallery:', error);
        setGalleryImages([]);
        
        if (user?.username) {
          await storageService.setItem(`profile_gallery_${user.username}`, []);
        }
      }
    }
  };

  // Wrapped clear function that returns void
  const clearAllGalleryImages = () => {
    // Call async function but don't return the promise
    clearAllGalleryImagesAsync();
  };

  // Enhanced save handler that includes gallery
  const handleSave = async () => {
    // Create profile data object with gallery
    const profileDataToSave = {
      bio: profileData.bio,
      profilePic: profileData.preview || profileData.profilePic,
      subscriptionPrice: profileData.subscriptionPrice,
      galleryImages: galleryImages.map(url => {
        // Convert full URLs back to relative paths for storage
        if (url.startsWith(`${API_BASE_URL}/uploads/`)) {
          return url.replace(API_BASE_URL, '');
        }
        return url;
      }),
    };
    
    // Save profile including gallery URLs
    await baseSaveProfile(profileDataToSave);
    
    // Also save gallery separately if needed
    if (galleryImages.length > 0) {
      await handleSaveWithGallery(galleryImages);
    }
    
    return saveSuccess;
  };

  return {
    // User
    user,
    
    // Profile data
    bio: profileData.bio,
    setBio: profileData.setBio,
    profilePic: profileData.profilePic,
    preview: profileData.preview,
    subscriptionPrice: profileData.subscriptionPrice,
    setSubscriptionPrice: profileData.setSubscriptionPrice,
    profileUploading: profileData.isUploading,
    handleProfilePicChange: profileData.handleProfilePicChange,
    removeProfilePic: profileData.removeProfilePic,
    profilePicInputRef,
    
    // Gallery - Now returning void functions
    galleryImages,
    selectedFiles,
    galleryUploading,
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,  // Returns void
    removeGalleryImage,   // Returns void  
    clearAllGalleryImages, // Returns void
    validationError,
    
    // Tier info
    sellerTierInfo: tierData.sellerTierInfo,
    userStats: tierData.userStats,
    getTierProgress: tierData.getTierProgress,
    getNextTier: tierData.getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,
    
    // Save functionality
    saveSuccess,
    saveError,
    isSaving,
    handleSave
  };
}