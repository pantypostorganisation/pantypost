// src/hooks/seller-settings/useProfileSave.ts

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sanitizeStrict, sanitizeUrl } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { usersService } from '@/services/users.service';
import { apiClient } from '@/services/api.config';

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
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    
    // Validate and sanitize data
    const sanitizedData = validateAndSanitizeData(data);
    if (!sanitizedData) {
      setIsSaving(false);
      return; // Error already set
    }

    try {
      console.log('[useProfileSave] Saving profile for:', user.username);
      console.log('[useProfileSave] Data to save:', sanitizedData);

      // Use the users service if available, otherwise use apiClient directly
      let response;
      
      // Try using the users service first (it handles caching and other optimizations)
      if (usersService && typeof usersService.updateUserProfile === 'function') {
        console.log('[useProfileSave] Using usersService.updateUserProfile');
        response = await usersService.updateUserProfile(user.username, sanitizedData);
      } else {
        // Fallback to direct API call
        console.log('[useProfileSave] Using direct API call');
        response = await apiClient.call(`/users/${user.username}/profile`, {
          method: 'PATCH',
          body: JSON.stringify(sanitizedData)
        });
      }

      if (response.success) {
        console.log('[useProfileSave] Profile saved successfully:', response.data);
        
        // Update user in auth context if bio or profile pic changed
        const updates: any = {};
        if (sanitizedData.bio && sanitizedData.bio !== user.bio) {
          updates.bio = sanitizedData.bio;
        }
        if (sanitizedData.profilePic && sanitizedData.profilePic !== user.profilePicture) {
          updates.profilePicture = sanitizedData.profilePic;
        }
        
        if (Object.keys(updates).length > 0 && updateUser) {
          await updateUser(updates);
        }

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('[useProfileSave] Failed to save profile:', response.error);
        setSaveError(response.error?.message || 'Failed to save profile');
        
        // Show error for 5 seconds
        setTimeout(() => setSaveError(''), 5000);
      }
    } catch (error) {
      console.error('[useProfileSave] Error saving profile:', error);
      setSaveError('Failed to save profile. Please try again.');
      
      // Show error for 5 seconds
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithGallery = async (galleryImages: string[]) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    setSaveError('');
    setIsSaving(true);

    // Sanitize gallery URLs
    const sanitizedGallery = galleryImages
      .map(url => sanitizeUrl(url))
      .filter((url): url is string => url !== '' && url !== null)
      .slice(0, 20); // Enforce max limit

    try {
      console.log('[useProfileSave] Updating gallery for:', user.username);
      console.log('[useProfileSave] Gallery images:', sanitizedGallery);

      // Update profile with just gallery images
      let response;
      
      if (usersService && typeof usersService.updateUserProfile === 'function') {
        console.log('[useProfileSave] Updating gallery via usersService');
        response = await usersService.updateUserProfile(user.username, {
          galleryImages: sanitizedGallery
        });
      } else {
        console.log('[useProfileSave] Updating gallery via direct API call');
        response = await apiClient.call(`/users/${user.username}/profile`, {
          method: 'PATCH',
          body: JSON.stringify({ galleryImages: sanitizedGallery })
        });
      }

      if (!response.success) {
        console.error('[useProfileSave] Failed to save gallery:', response.error);
        setSaveError(response.error?.message || 'Failed to save gallery images');
        
        // Show error for 5 seconds
        setTimeout(() => setSaveError(''), 5000);
      } else {
        console.log('[useProfileSave] Gallery saved successfully');
        
        // Show success briefly
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('[useProfileSave] Error saving gallery:', error);
      setSaveError('Failed to save gallery images');
      
      // Show error for 5 seconds
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveSuccess,
    saveError,
    isSaving,
    handleSave,
    handleSaveWithGallery
  };
}