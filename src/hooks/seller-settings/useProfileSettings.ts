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

  // Combined save handler
  const handleSaveAll = () => {
    // If there's a preview, that becomes the new profile pic
    const finalProfilePic = profileData.preview || profileData.profilePic;
    
    save.handleSave({
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
  };

  // Gallery save handlers
  const handleGalleryUpload = () => {
    gallery.uploadGalleryImages(save.handleSaveWithGallery);
  };

  const handleGalleryImageRemove = (index: number) => {
    gallery.removeGalleryImage(index, save.handleSaveWithGallery);
  };

  const handleClearGallery = () => {
    gallery.clearAllGalleryImages(save.handleSaveWithGallery);
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
    
    // Gallery
    galleryImages: gallery.galleryImages,
    selectedFiles: gallery.selectedFiles,
    galleryUploading: gallery.isUploading,
    uploadProgress: gallery.uploadProgress,
    multipleFileInputRef: gallery.multipleFileInputRef,
    handleMultipleFileChange: gallery.handleMultipleFileChange,
    removeSelectedFile: gallery.removeSelectedFile,
    uploadGalleryImages: handleGalleryUpload,
    removeGalleryImage: handleGalleryImageRemove,
    clearAllGalleryImages: handleClearGallery,
    
    // Tier info
    ...tierInfo,
    selectedTierDetails,
    setSelectedTierDetails,
    
    // Save functionality
    saveSuccess: save.saveSuccess,
    handleSave: handleSaveAll
  };
}
