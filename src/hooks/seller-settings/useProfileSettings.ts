// src/hooks/seller-settings/useProfileSettings.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { useProfileSave } from './useProfileSave';
import { useTierCalculation } from './useTierCalculation';
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
  
  // Gallery state - NO LOCAL STORAGE
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  // Profile save management
  const { saveSuccess, saveError, isSaving, handleSave: baseSaveProfile, handleSaveWithGallery } = useProfileSave();
  
  // Tier calculation - backend data only
  const tierData = useTierCalculation();
  
  // State for tier modal
  const [selectedTierDetails, setSelectedTierDetails] = useState<any>(null);

  // Load gallery images from backend ONLY - NO LOCAL STORAGE
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (!user?.username || !token) {
        setGalleryImages([]);
        return;
      }

      try {
        const response = await fetch(buildApiUrl('/users/:username/profile', { username: user.username }), {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const userData = data.data.profile || data.data;
            
            if (userData.galleryImages && Array.isArray(userData.galleryImages)) {
              const validatedGallery = userData.galleryImages
                .map((url: string) => {
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    return url;
                  } else if (url.startsWith('/uploads/')) {
                    return `${API_BASE_URL}${url}`;
                  } else {
                    return sanitizeUrl(url);
                  }
                })
                .filter((url: string | null): url is string => url !== '' && url !== null)
                .slice(0, MAX_GALLERY_IMAGES);
              
              setGalleryImages(validatedGallery);
            } else {
              setGalleryImages([]);
            }
          }
        } else {
          console.error('Failed to load gallery images from backend');
          setGalleryImages([]);
        }
      } catch (error) {
        console.error('Failed to load gallery images from backend:', error);
        setGalleryImages([]);
      }
    };
    
    loadGalleryImages();
  }, [user?.username, token]);

  // Refresh tier data when profile is saved
  useEffect(() => {
    if (saveSuccess && tierData.refreshTierData) {
      tierData.refreshTierData();
    }
  }, [saveSuccess, tierData.refreshTierData]);

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

  // Upload gallery images - BACKEND ONLY
  const uploadGalleryImagesAsync = async () => {
    if (selectedFiles.length === 0 || !token) return;

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

    setGalleryUploading(true);
    setUploadProgress(0);
    setValidationError('');
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(buildApiUrl('/upload/gallery'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const uploadGalleryImages = () => {
    uploadGalleryImagesAsync();
  };

  // Remove gallery image - BACKEND ONLY
  const removeGalleryImageAsync = async (index: number) => {
    if (index < 0 || index >= galleryImages.length || !token) return;
    
    try {
      const response = await fetch(buildApiUrl(`/upload/gallery/${index}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove image');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
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
      }
    } catch (error) {
      console.error('Failed to remove image:', error);
      // Just remove from state if backend fails
      const updatedGallery = galleryImages.filter((_, i) => i !== index);
      setGalleryImages(updatedGallery);
    }
  };

  const removeGalleryImage = (index: number) => {
    removeGalleryImageAsync(index);
  };

  // Clear all gallery images - BACKEND ONLY
  const clearAllGalleryImagesAsync = async () => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      if (!token) {
        setGalleryImages([]);
        return;
      }

      try {
        for (let i = galleryImages.length - 1; i >= 0; i--) {
          await fetch(buildApiUrl(`/upload/gallery/${i}`), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
        
        setGalleryImages([]);
      } catch (error) {
        console.error('Failed to clear gallery:', error);
        setGalleryImages([]);
      }
    }
  };

  const clearAllGalleryImages = () => {
    clearAllGalleryImagesAsync();
  };

  // Enhanced save handler
  const handleSave = async () => {
    const profileDataToSave = {
      bio: profileData.bio,
      profilePic: profileData.preview || profileData.profilePic,
      subscriptionPrice: profileData.subscriptionPrice,
      galleryImages: galleryImages.map(url => {
        if (url.startsWith(`${API_BASE_URL}/uploads/`)) {
          return url.replace(API_BASE_URL, '');
        }
        return url;
      }),
    };
    
    await baseSaveProfile(profileDataToSave);
    
    if (galleryImages.length > 0) {
      await handleSaveWithGallery(galleryImages);
    }
    
    // Refresh tier data after save
    if (tierData.refreshTierData) {
      await tierData.refreshTierData();
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
    
    // Gallery - NO LOCAL STORAGE
    galleryImages,
    selectedFiles,
    galleryUploading,
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages,
    validationError,
    
    // Tier info - BACKEND ONLY
    sellerTierInfo: tierData.sellerTierInfo,
    userStats: tierData.userStats,
    getTierProgress: tierData.getTierProgress,
    getNextTier: tierData.getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,
    isTierLoading: tierData.isLoading,
    tierError: tierData.error,
    
    // Save functionality
    saveSuccess,
    saveError,
    isSaving,
    handleSave
  };
}