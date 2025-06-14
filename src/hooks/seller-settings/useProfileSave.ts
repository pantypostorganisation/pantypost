// src/hooks/seller-settings/useProfileSave.ts
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useProfileSave() {
  const { user, updateUser } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (data: {
    bio: string;
    profilePic: string | null;
    subscriptionPrice: string;
    galleryImages?: string[];
  }) => {
    if (!user?.username) return;

    try {
      // Get existing user profiles data
      const profilesData = localStorage.getItem('user_profiles') || '{}';
      const profiles = JSON.parse(profilesData);
      
      // Update this user's profile with the actual profile pic (not preview)
      profiles[user.username] = {
        ...profiles[user.username],
        bio: data.bio,
        profilePic: data.profilePic,
        subscriptionPrice: data.subscriptionPrice,
        lastUpdated: new Date().toISOString()
      };
      
      // Save back to localStorage (shared storage)
      localStorage.setItem('user_profiles', JSON.stringify(profiles));
      
      // Also update sessionStorage for faster local access
      sessionStorage.setItem(`profile_bio_${user.username}`, data.bio);
      if (data.profilePic) {
        sessionStorage.setItem(`profile_pic_${user.username}`, data.profilePic);
      } else {
        sessionStorage.removeItem(`profile_pic_${user.username}`);
      }
      sessionStorage.setItem(`subscription_price_${user.username}`, data.subscriptionPrice);
      
      // Save gallery if provided
      if (data.galleryImages !== undefined) {
        localStorage.setItem(`profile_gallery_${user.username}`, JSON.stringify(data.galleryImages));
      }

      // Update user in auth context if needed
      if (data.bio && updateUser) {
        updateUser({ bio: data.bio });
      }

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
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
