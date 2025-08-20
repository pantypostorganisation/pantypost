// src/hooks/seller-settings/useProfileSettings.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services/users.service';
import { useGalleryManagement } from './useGalleryManagement';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { getTierInfo, getUserStats, getNextTier } from '@/utils/sellerTiers';
import { TierLevel } from '@/utils/sellerTiers';
import { apiCall } from '@/services/api.config';

export function useProfileSettings() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [profileUploading, setProfileUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTierDetails, setSelectedTierDetails] = useState<TierLevel | null>(null);

  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Gallery management hook
  const {
    galleryImages,
    selectedFiles,
    isUploading: galleryUploading,
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages: uploadGalleryImagesBase,
    removeGalleryImage: removeGalleryImageBase,
    clearAllGalleryImages: clearAllGalleryImagesBase
  } = useGalleryManagement();

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.username) return;

      try {
        const response = await usersService.getUserProfile(user.username);
        if (response.success && response.data) {
          setBio(response.data.bio || '');
          setProfilePic(response.data.profilePic || null);
          setSubscriptionPrice(response.data.subscriptionPrice || '');
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadProfileData();
  }, [user]);

  // Get tier info
  const sellerTierInfo = user?.tier ? getTierInfo(user.tier) : null;
  const userStats = getUserStats(user);

  // Handle profile picture change
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setProfileUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      setProfilePic(result.url);
      setPreview(result.url);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setSaveError('Failed to upload profile picture');
    } finally {
      setProfileUploading(false);
    }
  };

  // Remove profile picture
  const removeProfilePic = () => {
    setProfilePic(null);
    setPreview(null);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user?.username) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      // Update profile via API
      const response = await usersService.updateUserProfile(user.username, {
        bio,
        profilePic,
        subscriptionPrice,
        galleryImages
      });

      if (response.success) {
        setSaveSuccess(true);
        
        // Update user context if profile pic changed - handle null properly
        if (profilePic !== user.profilePicture) {
          updateUser({ ...user, profilePicture: profilePic || undefined });
        }

        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(response.error?.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Gallery functions that save to backend
  const uploadGalleryImages = () => {
    uploadGalleryImagesBase(async (updatedImages) => {
      // Save to backend - fix the path to not include /api prefix
      try {
        // For gallery images, handle both string URLs and objects
        const imageUrls = updatedImages.map(img => {
          // If it's already a string URL
          if (typeof img === 'string') {
            // If it's a base64 image, truncate for now to avoid payload size
            if (img.startsWith('data:')) {
              return img.substring(0, 100) + '...'; // Truncate for now to avoid payload size
            }
            return img;
          }
          // If it's an object with url property
          if (typeof img === 'object' && img !== null && 'url' in img) {
            const url = (img as any).url;
            if (url && url.startsWith('data:')) {
              return url.substring(0, 100) + '...';
            }
            return url;
          }
          return img;
        });

        const response = await apiCall(`/users/${user?.username}/gallery`, {
          method: 'PATCH',
          body: JSON.stringify({
            action: 'replace',
            images: imageUrls
          })
        });
        
        if (!response.success) {
          console.error('Failed to save gallery to backend:', response.error);
          // Don't throw error, just log it - gallery is saved locally
        }
      } catch (error) {
        console.error('Failed to save gallery to backend:', error);
        // Don't throw error, just log it - gallery is saved locally
      }
    });
  };

  const removeGalleryImage = (index: number) => {
    removeGalleryImageBase(index, async (updatedImages) => {
      // Save to backend - fix the path
      try {
        const imageUrls = updatedImages.map(img => {
          // If it's already a string URL
          if (typeof img === 'string') {
            if (img.startsWith('data:')) {
              return img.substring(0, 100) + '...'; // Truncate for now
            }
            return img;
          }
          // If it's an object with url property
          if (typeof img === 'object' && img !== null && 'url' in img) {
            const url = (img as any).url;
            if (url && url.startsWith('data:')) {
              return url.substring(0, 100) + '...';
            }
            return url;
          }
          return img;
        });

        const response = await apiCall(`/users/${user?.username}/gallery`, {
          method: 'PATCH',
          body: JSON.stringify({
            action: 'replace',
            images: imageUrls
          })
        });
        
        if (!response.success) {
          console.error('Failed to update gallery in backend:', response.error);
        }
      } catch (error) {
        console.error('Failed to update gallery in backend:', error);
      }
    });
  };

  const clearAllGalleryImages = () => {
    clearAllGalleryImagesBase(async () => {
      // Clear in backend - fix the path
      try {
        const response = await apiCall(`/users/${user?.username}/gallery`, {
          method: 'PATCH',
          body: JSON.stringify({
            action: 'clear'
          })
        });
        
        if (!response.success) {
          console.error('Failed to clear gallery in backend:', response.error);
        }
      } catch (error) {
        console.error('Failed to clear gallery in backend:', error);
      }
    });
  };

  // Tier helpers
  const getTierProgress = () => {
    if (!sellerTierInfo) return { salesProgress: 0, revenueProgress: 0 };
    
    const nextTier = getNextTier(sellerTierInfo.tier);
    if (!nextTier || nextTier === 'None') return { salesProgress: 100, revenueProgress: 100 };
    
    const nextTierInfo = getTierInfo(nextTier);
    const salesProgress = Math.min(100, (userStats.totalSales / nextTierInfo.minSales) * 100);
    const revenueProgress = Math.min(100, (userStats.totalRevenue / nextTierInfo.minAmount) * 100);
    
    return { salesProgress, revenueProgress };
  };

  return {
    // User
    user,
    
    // Profile data
    bio,
    setBio,
    profilePic,
    preview,
    subscriptionPrice,
    setSubscriptionPrice,
    profileUploading,
    handleProfilePicChange,
    removeProfilePic,
    profilePicInputRef,
    
    // Gallery
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
    
    // Tier info
    sellerTierInfo,
    userStats,
    getTierProgress,
    getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,
    
    // Save functionality
    saveSuccess,
    saveError,
    isSaving,
    handleSave
  };
}