// src/hooks/seller-settings/useProfileSave.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { usersService } from '@/services/users.service';
import { enhancedUsersService } from '@/services/users.service.enhanced';
import { apiClient } from '@/services/api.config';

interface ProfileSaveData {
  bio: string;
  profilePic: string | null;
  subscriptionPrice: string;
  galleryImages?: string[];
}

interface UseProfileSaveReturn {
  saveSuccess: boolean;
  saveError: string;
  isSaving: boolean;
  handleSave: (data: ProfileSaveData) => Promise<void>;
  handleSaveWithGallery: (galleryImages: string[]) => Promise<void>;
  handleQuickSave: (data: Partial<ProfileSaveData>) => Promise<void>;
  debouncedSave: (data: Partial<ProfileSaveData>) => void;
}

export function useProfileSave(): UseProfileSaveReturn {
  const { user, updateUser } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Store the latest data for debounced saves
  const latestDataRef = useRef<Partial<ProfileSaveData>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSavePromiseRef = useRef<Promise<void> | null>(null);

  // Custom URL validator that accepts placeholders
  const validateProfilePicUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    // Allow placeholder URLs
    if (url.includes('placeholder')) return url;
    
    // Allow relative URLs
    if (url.startsWith('/uploads/')) return url;
    
    // Allow http/https URLs
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // Otherwise, consider it invalid
    return null;
  };

  const validateGalleryUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Allow relative URLs
    if (url.startsWith('/uploads/')) return url;
    
    // Allow http/https URLs
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // Otherwise, consider it invalid
    return null;
  };

  const validateAndSanitizeData = (data: Partial<ProfileSaveData>): Partial<ProfileSaveData> | null => {
    try {
      const sanitized: Partial<ProfileSaveData> = {};

      // Sanitize bio if provided
      if (data.bio !== undefined) {
        const sanitizedBio = sanitizeStrict(data.bio);
        if (sanitizedBio.length > 500) {
          setSaveError('Bio must be less than 500 characters');
          return null;
        }
        sanitized.bio = sanitizedBio;
      }

      // Validate profile pic URL if provided
      if (data.profilePic !== undefined) {
        const sanitizedProfilePic = validateProfilePicUrl(data.profilePic);
        if (data.profilePic && !sanitizedProfilePic) {
          setSaveError('Invalid profile picture URL');
          return null;
        }
        sanitized.profilePic = sanitizedProfilePic;
      }

      // Validate subscription price if provided
      if (data.subscriptionPrice !== undefined) {
        const priceValidation = securityService.validateAmount(data.subscriptionPrice, {
          min: 0,
          max: 999.99,
          allowDecimals: true
        });

        if (!priceValidation.valid) {
          setSaveError(priceValidation.error || 'Invalid subscription price');
          return null;
        }
        sanitized.subscriptionPrice = data.subscriptionPrice;
      }

      // Sanitize gallery images if provided
      if (data.galleryImages !== undefined) {
        const sanitizedGallery = data.galleryImages
          .map(url => validateGalleryUrl(url))
          .filter((url): url is string => url !== null);
        
        if (sanitizedGallery.length > 20) {
          setSaveError('Maximum 20 gallery images allowed');
          return null;
        }
        sanitized.galleryImages = sanitizedGallery;
      }

      return sanitized;
    } catch (error) {
      setSaveError('Data validation failed');
      return null;
    }
  };

  // Quick save for individual fields with optimistic updates
  const handleQuickSave = useCallback(async (data: Partial<ProfileSaveData>) => {
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
      console.log('[useProfileSave] Quick saving:', sanitizedData);

      // Use enhanced service for better caching
      let response;
      if (enhancedUsersService && typeof enhancedUsersService.updateUserProfile === 'function') {
        response = await enhancedUsersService.updateUserProfile(user.username, sanitizedData);
      } else if (usersService && typeof usersService.updateUserProfile === 'function') {
        response = await usersService.updateUserProfile(user.username, sanitizedData);
      } else {
        response = await apiClient.call(`/users/${user.username}/profile`, {
          method: 'PATCH',
          body: JSON.stringify(sanitizedData)
        });
      }

      if (response.success) {
        console.log('[useProfileSave] Quick save successful');
        
        // Update user in auth context if needed
        const updates: any = {};
        if (sanitizedData.bio !== undefined && sanitizedData.bio !== user.bio) {
          updates.bio = sanitizedData.bio;
        }
        if (sanitizedData.profilePic !== undefined && sanitizedData.profilePic !== user.profilePicture) {
          updates.profilePicture = sanitizedData.profilePic;
        }
        
        if (Object.keys(updates).length > 0 && updateUser) {
          await updateUser(updates);
        }

        // Brief success indication
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        console.error('[useProfileSave] Quick save failed:', response.error);
        setSaveError(response.error?.message || 'Failed to save');
        setTimeout(() => setSaveError(''), 3000);
      }
    } catch (error) {
      console.error('[useProfileSave] Error in quick save:', error);
      setSaveError('Failed to save. Please try again.');
      setTimeout(() => setSaveError(''), 3000);
    }
  }, [user?.username, user?.bio, user?.profilePicture, updateUser]);

  // Debounced save function
  const debouncedSave = useCallback((data: Partial<ProfileSaveData>) => {
    // Update the latest data
    latestDataRef.current = { ...latestDataRef.current, ...data };
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Show saving indicator immediately
    setIsSaving(true);
    
    // Set new timeout for save
    saveTimeoutRef.current = setTimeout(async () => {
      const savePromise = handleQuickSave(latestDataRef.current);
      pendingSavePromiseRef.current = savePromise;
      
      await savePromise;
      
      pendingSavePromiseRef.current = null;
      latestDataRef.current = {};
      setIsSaving(false);
    }, 1500); // Save after 1.5 seconds of inactivity
  }, [handleQuickSave]);

  // Main save function (for explicit save button)
  const handleSave = async (data: ProfileSaveData) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    // Cancel any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Wait for any pending save to complete
    if (pendingSavePromiseRef.current) {
      await pendingSavePromiseRef.current;
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

      // Use enhanced service for better caching
      let response;
      if (enhancedUsersService && typeof enhancedUsersService.updateUserProfile === 'function') {
        console.log('[useProfileSave] Using enhancedUsersService.updateUserProfile');
        response = await enhancedUsersService.updateUserProfile(user.username, sanitizedData);
      } else if (usersService && typeof usersService.updateUserProfile === 'function') {
        console.log('[useProfileSave] Using usersService.updateUserProfile');
        response = await usersService.updateUserProfile(user.username, sanitizedData);
      } else {
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
        setTimeout(() => setSaveError(''), 5000);
      }
    } catch (error) {
      console.error('[useProfileSave] Error saving profile:', error);
      setSaveError('Failed to save profile. Please try again.');
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

    // Sanitize gallery URLs with custom validator
    const sanitizedGallery = galleryImages
      .map(url => validateGalleryUrl(url))
      .filter((url): url is string => url !== null)
      .slice(0, 20); // Enforce max limit

    try {
      console.log('[useProfileSave] Updating gallery for:', user.username);
      console.log('[useProfileSave] Gallery images:', sanitizedGallery);

      // Update profile with just gallery images
      let response;
      
      if (enhancedUsersService && typeof enhancedUsersService.updateUserProfile === 'function') {
        console.log('[useProfileSave] Updating gallery via enhancedUsersService');
        response = await enhancedUsersService.updateUserProfile(user.username, {
          galleryImages: sanitizedGallery
        });
      } else if (usersService && typeof usersService.updateUserProfile === 'function') {
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
        setTimeout(() => setSaveError(''), 5000);
      } else {
        console.log('[useProfileSave] Gallery saved successfully');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('[useProfileSave] Error saving gallery:', error);
      setSaveError('Failed to save gallery images');
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Clean up on unmount - ensure pending saves complete
  useEffect(() => {
    return () => {
      // Clear timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // If there's pending data, save it immediately
      if (Object.keys(latestDataRef.current).length > 0) {
        handleQuickSave(latestDataRef.current);
      }
    };
  }, [handleQuickSave]);

  return {
    saveSuccess,
    saveError,
    isSaving,
    handleSave,
    handleSaveWithGallery,
    handleQuickSave,
    debouncedSave
  };
}