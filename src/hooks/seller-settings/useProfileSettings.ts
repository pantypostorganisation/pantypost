// src/hooks/seller-settings/useProfileSettings.ts

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { useGalleryManagement } from './useGalleryManagement';
import { useTierCalculation } from './useTierCalculation';
import { useProfileSave } from './useProfileSave';
import { TierLevel } from '@/utils/sellerTiers';

export function useProfileSettings() {
  const { user } = useAuth();
  const [selectedTierDetails, setSelectedTierDetails] = useState<TierLevel | null>(null);
  
  // Use all the sub-hooks
  const profileData = useProfileData();
  const gallery = useGalleryManagement();
  const tierInfo = useTierCalculation();
  const save = useProfileSave();

  // Combined save handler with security
  const handleSaveAll = async () => {
    if (!user?.username) {
      alert('You must be logged in to save profile changes');
      return;
    }

    // Check if there are validation errors
    if (profileData.errors.bio || profileData.errors.subscriptionPrice) {
      alert('Please fix validation errors before saving');
      return;
    }

    // If using the enhanced profile data hook, use its save method
    if ('saveProfile' in profileData && typeof profileData.saveProfile === 'function') {
      const success = await profileData.saveProfile();
      if (!success) {
        // Error already handled by saveProfile
        return;
      }
    } else {
      // Fallback to using the save hook
      const finalProfilePic = profileData.preview || profileData.profilePic;
      
      await save.handleSave({
        bio: profileData.bio,
        profilePic: finalProfilePic,
        subscriptionPrice: profileData.subscriptionPrice,
        galleryImages: gallery.galleryImages
      });
      
      // Clear preview after saving
      if (profileData.preview) {
        profileData.setProfilePic(finalProfilePic);
        profileData.setPreview(null);
      }
    }
  };

  // Gallery save handlers with security
  const handleGalleryUpload = () => {
    if (!user?.username) {
      alert('You must be logged in to upload gallery images');
      return;
    }

    if (gallery.validationError) {
      alert(gallery.validationError);
      return;
    }

    gallery.uploadGalleryImages(save.handleSaveWithGallery);
  };

  const handleGalleryImageRemove = (index: number) => {
    if (!user?.username) {
      alert('You must be logged in to remove gallery images');
      return;
    }

    gallery.removeGalleryImage(index, save.handleSaveWithGallery);
  };

  const handleClearGallery = () => {
    if (!user?.username) {
      alert('You must be logged in to clear gallery images');
      return;
    }

    gallery.clearAllGalleryImages(save.handleSaveWithGallery);
  };

  // Validate tier details selection
  const handleSelectTierDetails = (tier: TierLevel | null) => {
    const validTiers: TierLevel[] = ['None', 'Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    if (tier && !validTiers.includes(tier)) {
      return;
    }
    setSelectedTierDetails(tier);
  };

  return {
    // User
    user,
    
    // Profile data
    bio: profileData.bio,
    setBio: profileData.setBio,
    profilePic: profileData.profilePic,
    setProfilePic: profileData.setProfilePic,
    preview: profileData.preview,
    setPreview: profileData.setPreview,
    subscriptionPrice: profileData.subscriptionPrice,
    setSubscriptionPrice: profileData.setSubscriptionPrice,
    profileUploading: profileData.isUploading,
    handleProfilePicChange: profileData.handleProfilePicChange,
    removeProfilePic: profileData.removeProfilePic,
    profileErrors: profileData.errors,
    
    // Gallery
    galleryImages: gallery.galleryImages,
    selectedFiles: gallery.selectedFiles,
    galleryUploading: gallery.isUploading,
    uploadProgress: gallery.uploadProgress,
    galleryValidationError: gallery.validationError,
    maxGalleryImages: gallery.maxGalleryImages,
    multipleFileInputRef: gallery.multipleFileInputRef,
    handleMultipleFileChange: gallery.handleMultipleFileChange,
    removeSelectedFile: gallery.removeSelectedFile,
    uploadGalleryImages: handleGalleryUpload,
    removeGalleryImage: handleGalleryImageRemove,
    clearAllGalleryImages: handleClearGallery,
    
    // Tier info
    ...tierInfo,
    selectedTierDetails,
    setSelectedTierDetails: handleSelectTierDetails,
    
    // Save functionality
    saveSuccess: save.saveSuccess || ('isSaving' in profileData && !profileData.isSaving && save.saveSuccess),
    saveError: save.saveError,
    isSaving: 'isSaving' in profileData ? profileData.isSaving : false,
    handleSave: handleSaveAll,
    
    // Additional features from enhanced profile data
    ...(('completeness' in profileData) && {
      profileCompleteness: profileData.completeness,
      preferences: profileData.preferences,
      updatePreferences: profileData.updatePreferences,
      refreshProfile: profileData.refreshProfile
    })
  };
}