// src/hooks/seller-settings/useProfileSave.ts
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useProfileSave() {
  const { user } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (data: {
    bio: string;
    profilePic: string | null;
    subscriptionPrice: string;
    galleryImages?: string[];
  }) => {
    if (!user?.username) return;

    // Save bio
    sessionStorage.setItem(`profile_bio_${user.username}`, data.bio);
    
    // Save profile pic
    if (data.profilePic) {
      sessionStorage.setItem(`profile_pic_${user.username}`, data.profilePic);
    } else {
      sessionStorage.removeItem(`profile_pic_${user.username}`);
    }
    
    // Save subscription price
    sessionStorage.setItem(`subscription_price_${user.username}`, data.subscriptionPrice);
    
    // Save gallery if provided
    if (data.galleryImages !== undefined) {
      localStorage.setItem(`profile_gallery_${user.username}`, JSON.stringify(data.galleryImages));
    }

    // Show success message
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveWithGallery = (galleryImages: string[]) => {
    if (!user?.username) return;
    localStorage.setItem(`profile_gallery_${user.username}`, JSON.stringify(galleryImages));
  };

  return {
    saveSuccess,
    handleSave,
    handleSaveWithGallery
  };
}
