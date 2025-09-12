// src/hooks/seller-settings/useProfileSave.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sanitizeStrict, sanitizeUrl } from '@/utils/security/sanitization';
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

const sanitizeGalleryArray = (arr: string[] | undefined): string[] | undefined => {
  if (!arr) return undefined;
  return arr
    .map((u) => sanitizeUrl(u))
    .filter((u): u is string => !!u)
    .slice(0, 20);
};

export function useProfileSave(): UseProfileSaveReturn {
  const { user, updateUser } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const latestDataRef = useRef<Partial<ProfileSaveData>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSavePromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const validateProfilePicUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (url.includes('placeholder')) return url;
    if (url.startsWith('/uploads/')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const sanitized = sanitizeUrl(url);
      return sanitized;
    }
    return null;
  };

  const validateAndSanitizeData = (data: Partial<ProfileSaveData>): Partial<ProfileSaveData> | null => {
    try {
      const sanitized: Partial<ProfileSaveData> = {};

      if (data.bio !== undefined) {
        const sanitizedBio = sanitizeStrict(data.bio);
        if (sanitizedBio.length > 500) {
          setSaveError('Bio must be less than 500 characters');
          return null;
        }
        sanitized.bio = sanitizedBio;
      }

      if (data.profilePic !== undefined) {
        const sanitizedProfilePic = validateProfilePicUrl(data.profilePic);
        if (data.profilePic && !sanitizedProfilePic) {
          setSaveError('Invalid profile picture URL');
          return null;
        }
        sanitized.profilePic = sanitizedProfilePic;
      }

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

      if (data.galleryImages !== undefined) {
        const sanitizedGallery = sanitizeGalleryArray(data.galleryImages);
        if (!sanitizedGallery) {
          setSaveError('Invalid gallery images');
          return null;
        }
        if (sanitizedGallery.length > 20) {
          setSaveError('Maximum 20 gallery images allowed');
          return null;
        }
        sanitized.galleryImages = sanitizedGallery;
      }

      return sanitized;
    } catch {
      setSaveError('Data validation failed');
      return null;
    }
  };

  const callUpdateProfile = async (username: string, payload: Partial<ProfileSaveData>) => {
    if (enhancedUsersService && typeof enhancedUsersService.updateUserProfile === 'function') {
      return enhancedUsersService.updateUserProfile(username, payload);
    }
    if (usersService && typeof usersService.updateUserProfile === 'function') {
      return usersService.updateUserProfile(username, payload);
    }
    return apiClient.call(`/users/${username}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  };

  const handleQuickSave = useCallback(async (data: Partial<ProfileSaveData>) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }
    setSaveError('');

    const sanitizedData = validateAndSanitizeData(data);
    if (!sanitizedData) return;

    try {
      const response = await callUpdateProfile(user.username, sanitizedData);
      if (response.success) {
        const updates: any = {};
        if (sanitizedData.bio !== undefined && sanitizedData.bio !== user.bio) {
          updates.bio = sanitizedData.bio;
        }
        if (sanitizedData.profilePic !== undefined && sanitizedData.profilePic !== user.profilePicture) {
          updates.profilePicture = sanitizedData.profilePic;
        }
        if (Object.keys(updates).length > 0) {
          await updateUser?.(updates);
        }
        setSaveSuccess(true);
        setTimeout(() => mountedRef.current && setSaveSuccess(false), 2000);
      } else {
        setSaveError(response.error?.message || 'Failed to save');
        setTimeout(() => mountedRef.current && setSaveError(''), 3000);
      }
    } catch {
      setSaveError('Failed to save. Please try again.');
      setTimeout(() => mountedRef.current && setSaveError(''), 3000);
    }
  }, [user?.username, user?.bio, user?.profilePicture, updateUser]);

  const debouncedSave = useCallback((data: Partial<ProfileSaveData>) => {
    latestDataRef.current = { ...latestDataRef.current, ...data };

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      const savePromise = handleQuickSave(latestDataRef.current);
      pendingSavePromiseRef.current = savePromise;
      await savePromise;
      pendingSavePromiseRef.current = null;
      latestDataRef.current = {};
      if (mountedRef.current) setIsSaving(false);
    }, 1500);
  }, [handleQuickSave]);

  const handleSave = async (data: ProfileSaveData) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (pendingSavePromiseRef.current) await pendingSavePromiseRef.current;

    setSaveError('');
    setIsSaving(true);

    const sanitizedData = validateAndSanitizeData(data);
    if (!sanitizedData) {
      setIsSaving(false);
      return;
    }

    try {
      const response = await callUpdateProfile(user.username, sanitizedData);
      if (response.success) {
        const updates: any = {};
        if (sanitizedData.bio && sanitizedData.bio !== user.bio) updates.bio = sanitizedData.bio;
        if (sanitizedData.profilePic && sanitizedData.profilePic !== user.profilePicture) {
          updates.profilePicture = sanitizedData.profilePic;
        }
        if (Object.keys(updates).length > 0) {
          await updateUser?.(updates);
        }
        setSaveSuccess(true);
        setTimeout(() => mountedRef.current && setSaveSuccess(false), 3000);
      } else {
        setSaveError(response.error?.message || 'Failed to save profile');
        setTimeout(() => mountedRef.current && setSaveError(''), 5000);
      }
    } catch {
      setSaveError('Failed to save profile. Please try again.');
      setTimeout(() => mountedRef.current && setSaveError(''), 5000);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  };

  const handleSaveWithGallery = async (galleryImages: string[]) => {
    if (!user?.username) {
      setSaveError('User not authenticated');
      return;
    }

    setSaveError('');
    setIsSaving(true);

    const sanitizedGallery = sanitizeGalleryArray(galleryImages) ?? [];
    try {
      const response = await callUpdateProfile(user.username, { galleryImages: sanitizedGallery });
      if (!response.success) {
        setSaveError(response.error?.message || 'Failed to save gallery images');
        setTimeout(() => mountedRef.current && setSaveError(''), 5000);
      } else {
        setSaveSuccess(true);
        setTimeout(() => mountedRef.current && setSaveSuccess(false), 2000);
      }
    } catch {
      setSaveError('Failed to save gallery images');
      setTimeout(() => mountedRef.current && setSaveError(''), 5000);
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  };

  // Ensure pending debounced save is not lost on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (Object.keys(latestDataRef.current).length > 0) {
        void handleQuickSave(latestDataRef.current);
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
