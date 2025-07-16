// src/hooks/seller-settings/useProfileSave.ts

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services';
import { sanitizeStrict, sanitizeUrl, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

interface ProfileSaveData {
  bio: string;
  profilePic: string | null;
  subscriptionPrice: string;
  galleryImages?: string[];
}

export function useProfileSave() {
  const { user, updateUser } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  const validateAndSanitizeData = (data: ProfileSaveData): ProfileSaveData | null => {
    try {
      // Sanitize bio
      const sanitizedBio = sanitizeStrict(data.bio);
      if (sanitizedBio.length > 500) {
        setSaveError('Bio must be less than 500 characters');
        return null;
      }

      // Sanitize profile pic URL
      const sanitizedProfilePic = data.profilePic ? sanitizeUrl(data.profilePic) : null;
      if (data.profilePic && !sanitizedProfilePic) {
        setSaveError('Invalid profile picture URL');
        return null;
      }

      // Validate subscription price
      const priceValidation = securityService.validateAmount(data.subscriptionPrice, {
        min: 0,
        max: 999.99,
        allowDecimals: true
      });

      if (!priceValidation.valid) {
        setSaveError(priceValidation.error || 'Invalid subscription price');
        return null;
      }

      // Sanitize gallery images if provided
      let sanitizedGallery: string[] | undefined;
      if (data.galleryImages) {
        sanitizedGallery = data.galleryImages
          .map(url => sanitizeUrl(url))
          .filter((url): url is string => url !== '' && url !== null);
        
        if (sanitizedGallery.length > 20) {
          setSaveError('Maximum 20 gallery images allowed');
          return null;
        }
      }

      return {
        bio: sanitizedBio,
        profilePic: sanitizedProfilePic,
        subscriptionPrice: data.subscriptionPrice,
        galleryImages: sanitizedGallery
      };
    } catch (error) {
      setSaveError('Data validation failed');
      return null;
    }
  };

  const handleSave = async (data: ProfileSaveData) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    setSaveError('');
    
    // Validate and sanitize data
    const sanitizedData = validateAndSanitizeData(data);
    if (!sanitizedData) {
      return; // Error already set
    }

    try {
      // Get existing user profiles data
      const profiles = await storageService.getItem<Record<string, any>>('user_profiles', {});
      
      // Sanitize the profiles object to prevent prototype pollution
      const sanitizedProfiles = securityService.sanitizeForAPI(profiles) as Record<string, any>;
      
      // Update this user's profile with sanitized data
      sanitizedProfiles[user.username] = {
        ...sanitizedProfiles[user.username],
        bio: sanitizedData.bio,
        profilePic: sanitizedData.profilePic,
        subscriptionPrice: sanitizedData.subscriptionPrice,
        lastUpdated: new Date().toISOString()
      };
      
      // Save back to localStorage (shared storage)
      await storageService.setItem('user_profiles', sanitizedProfiles);
      
      // Also update sessionStorage for faster local access
      sessionStorage.setItem(`profile_bio_${user.username}`, sanitizedData.bio);
      if (sanitizedData.profilePic) {
        sessionStorage.setItem(`profile_pic_${user.username}`, sanitizedData.profilePic);
      } else {
        sessionStorage.removeItem(`profile_pic_${user.username}`);
      }
      sessionStorage.setItem(`subscription_price_${user.username}`, sanitizedData.subscriptionPrice);
      
      // Save gallery if provided
      if (sanitizedData.galleryImages !== undefined) {
        await storageService.setItem(`profile_gallery_${user.username}`, sanitizedData.galleryImages);
      }

      // Update user in auth context if needed
      if (sanitizedData.bio && updateUser) {
        updateUser({ bio: sanitizedData.bio });
      }

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save profile. Please try again.');
    }
  };

  const handleSaveWithGallery = async (galleryImages: string[]) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    setSaveError('');

    // Sanitize gallery URLs
    const sanitizedGallery = galleryImages
      .map(url => sanitizeUrl(url))
      .filter((url): url is string => url !== '' && url !== null)
      .slice(0, 20); // Enforce max limit

    try {
      await storageService.setItem(`profile_gallery_${user.username}`, sanitizedGallery);
    } catch (error) {
      console.error('Error saving gallery:', error);
      setSaveError('Failed to save gallery images');
    }
  };

  return {
    saveSuccess,
    saveError,
    handleSave,
    handleSaveWithGallery
  };
}