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
    save.handleSave({
      bio: profileData.bio,
      profilePic: profileData.profilePic,
      subscriptionPrice: profileData.subscriptionPrice,
      galleryImages: gallery.galleryImages
    });
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
    ...profileData,
    
    // Gallery
    galleryImages: gallery.galleryImages,
    selectedFiles: gallery.selectedFiles,
    isUploading: gallery.isUploading,
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
