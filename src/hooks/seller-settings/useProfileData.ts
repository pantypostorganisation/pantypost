// src/hooks/seller-settings/useProfileData.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { ProfileCompleteness, calculateProfileCompleteness } from '@/types/users';
import { profileSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeUrl } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

interface UseProfileDataReturn {
  // Profile data
  bio: string;
  setBio: (bio: string) => void;
  profilePic: string | null;
  setProfilePic: (pic: string | null) => void;
  preview: string | null;
  setPreview: (preview: string | null) => void;
  subscriptionPrice: string;
  setSubscriptionPrice: (price: string) => void;
  country: string;
  setCountry: (country: string) => void;
  isLocationPublic: boolean;
  setIsLocationPublic: (value: boolean) => void;

  // Gallery
  galleryImages: string[];
  setGalleryImages: (images: string[]) => void;
  
  // Profile completeness
  completeness: ProfileCompleteness | null;
  
  // User preferences
  preferences: any | null;
  updatePreferences: (updates: any) => Promise<void>;
  
  // States
  isUploading: boolean;
  isLoadingProfile: boolean;
  isSaving: boolean;
  
  // Actions - NOTE: handleProfilePicChange returns void, not Promise<void>
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeProfilePic: () => void;
  saveProfile: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  
  // Validation
  errors: {
    bio?: string;
    subscriptionPrice?: string;
  };
}

export function useProfileData(): UseProfileDataReturn {
  const { user, updateUser } = useAuth();
  const rateLimiter = getRateLimiter();
  
  // Profile state
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [isLocationPublic, setIsLocationPublic] = useState<boolean>(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Additional features
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [preferences, setPreferences] = useState<any | null>(null);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{ bio?: string; subscriptionPrice?: string; country?: string }>({});
  
  // Track unsaved changes
  const hasUnsavedChanges = useRef(false);
  const originalData = useRef<any>({});

  // Validate bio with security
  const validateBio = useCallback((value: string) => {
    try {
      const sanitized = sanitizeStrict(value);
      const result = profileSchemas.bio.safeParse(sanitized);
      
      if (!result.success) {
        setErrors(prev => ({ ...prev, bio: result.error.errors[0].message }));
        return false;
      }
      
      setErrors(prev => ({ ...prev, bio: undefined }));
      return true;
    } catch {
      setErrors(prev => ({ ...prev, bio: 'Invalid bio format' }));
      return false;
    }
  }, []);

  // Validate subscription price with security
  const validatePrice = useCallback((value: string) => {
    const validation = securityService.validateAmount(value, {
      min: 0,
      max: 999.99,
      allowDecimals: true
    });
    
    if (!validation.valid) {
      setErrors(prev => ({ 
        ...prev, 
        subscriptionPrice: validation.error || 'Invalid price' 
      }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, subscriptionPrice: undefined }));
    return true;
  }, []);

  // Load profile data
  const loadProfileData = useCallback(async () => {
    // Check if user exists and has username
    if (!user?.username) {
      console.warn('[useProfileData] No username available, skipping profile load');
      setIsLoadingProfile(false);
      return;
    }

    // Ensure username is defined and valid
    const username = user.username.trim();
    if (!username) {
      console.error('[useProfileData] Username is empty after trim');
      setIsLoadingProfile(false);
      return;
    }

    console.log(`[useProfileData] Loading profile data for username: "${username}"`);
    setIsLoadingProfile(true);
    
    try {
      // Get profile data with proper username
      console.log(`[useProfileData] Calling getUserProfile with username: "${username}"`);
      const profileResult = await usersService.getUserProfile(username);
      
      if (!profileResult.success) {
        console.error('[useProfileData] Failed to get user profile:', profileResult.error);
      } else if (profileResult.data) {
        const profile = profileResult.data;
        console.log('[useProfileData] Profile data loaded successfully:', profile);
        
        // Sanitize loaded data
        const sanitizedBio = sanitizeStrict(profile.bio || '');
        const sanitizedProfilePic = profile.profilePic ? sanitizeUrl(profile.profilePic) : null;
        
        setBio(sanitizedBio);
        setProfilePic(sanitizedProfilePic);
        // Ensure subscriptionPrice is always a string
        setSubscriptionPrice(String(profile.subscriptionPrice || '0'));
        
        // Sanitize gallery URLs
        const sanitizedGallery = (profile.galleryImages || [])
          .map(url => sanitizeUrl(url))
          .filter((url): url is string => url !== '' && url !== null);
        setGalleryImages(sanitizedGallery);
        
        // Store original data for change tracking
        const sanitizedCountry = profile.country ? sanitizeStrict(profile.country) : '';
        const locationPublic = Boolean(profile.isLocationPublic);

        setCountry(sanitizedCountry);
        setIsLocationPublic(locationPublic);

        originalData.current = {
          bio: sanitizedBio,
          profilePic: sanitizedProfilePic,
          subscriptionPrice: String(profile.subscriptionPrice || '0'),
          galleryImages: sanitizedGallery,
          country: sanitizedCountry,
          isLocationPublic: locationPublic,
        };
      } else {
        console.warn('[useProfileData] No profile data returned');
      }

      // Calculate completeness - ensure username is passed
      console.log(`[useProfileData] Calling getUser with username: "${username}"`);
      const userResult = await usersService.getUser(username);
      
      if (!userResult.success) {
        console.error('[useProfileData] Failed to get user:', userResult.error);
      } else if (userResult.data && profileResult.data) {
        // Ensure subscriptionPrice is a string for calculateProfileCompleteness
        const comp = calculateProfileCompleteness(userResult.data, {
          ...profileResult.data,
          subscriptionPrice: String(profileResult.data.subscriptionPrice || '0')
        });
        setCompleteness(comp);
        console.log('[useProfileData] Profile completeness calculated:', comp);
      }

      // Load preferences - ensure username is passed
      console.log(`[useProfileData] Calling getUserPreferences with username: "${username}"`);
      const prefsResult = await usersService.getUserPreferences(username);
      
      if (!prefsResult.success) {
        console.error('[useProfileData] Failed to get user preferences:', prefsResult.error);
      } else if (prefsResult.data) {
        setPreferences(prefsResult.data);
        console.log('[useProfileData] User preferences loaded:', prefsResult.data);
      }

      // Track profile view activity
      await usersService.trackActivity({
        userId: username,
        type: 'profile_update',
        details: { action: 'profile_settings_viewed' },
      });
    } catch (error) {
      console.error('[useProfileData] Error loading profile data:', error);
      // Don't throw - just log the error and continue
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user?.username]);

  // Load profile data on mount and when user changes
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Track changes
  useEffect(() => {
    hasUnsavedChanges.current =
      bio !== originalData.current.bio ||
      profilePic !== originalData.current.profilePic ||
      subscriptionPrice !== originalData.current.subscriptionPrice ||
      JSON.stringify(galleryImages) !== JSON.stringify(originalData.current.galleryImages) ||
      country !== originalData.current.country ||
      isLocationPublic !== originalData.current.isLocationPublic;
  }, [bio, profilePic, subscriptionPrice, galleryImages, country, isLocationPublic]);

  // Internal async function for profile picture upload
  const handleProfilePicChangeAsync = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user exists
    if (!user?.username) {
      alert('Please log in to upload images');
      return;
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
      ...RATE_LIMITS.IMAGE_UPLOAD,
      identifier: user.username
    });

    if (!rateLimitResult.allowed) {
      alert(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }

    // Validate file with security service
    const validation = securityService.validateFileUpload(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);
      console.log('[useProfileData] Profile pic uploaded successfully:', result);
      
      // Validate uploaded URL
      const sanitizedUrl = sanitizeUrl(result.url);
      if (!sanitizedUrl) {
        throw new Error('Invalid image URL returned');
      }
      
      // Set the preview
      setPreview(sanitizedUrl);
      
      // Track upload activity
      await usersService.trackActivity({
        userId: user.username,
        type: 'profile_update',
        details: { action: 'profile_picture_uploaded' },
      });
    } catch (error) {
      console.error("[useProfileData] Error uploading profile image:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Wrapped function that returns void (for Zod compatibility)
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call the async function but don't return the promise
    handleProfilePicChangeAsync(e);
  };

  // Remove profile picture
  const removeProfilePic = () => {
    setProfilePic(null);
    setPreview(null);
  };

  // Save profile with optimistic update and security
  const saveProfile = async (): Promise<boolean> => {
    if (!user?.username) {
      console.error('[useProfileData] Cannot save profile: no username');
      alert('Please log in to save your profile');
      return false;
    }

    const username = user.username.trim();
    if (!username) {
      console.error('[useProfileData] Cannot save profile: username is empty');
      return false;
    }

    // Validate all fields
    const isBioValid = validateBio(bio);
    const isPriceValid = validatePrice(subscriptionPrice);
    const sanitizedCountry = sanitizeStrict(country).trim();
    if (!sanitizedCountry) {
      setErrors(prev => ({ ...prev, country: 'Please select your country' }));
      return false;
    }
    setErrors(prev => ({ ...prev, country: undefined }));

    if (!isBioValid || !isPriceValid) {
      return false;
    }

    // Check rate limit for profile saves
    const rateLimitResult = rateLimiter.check('PROFILE_UPDATE', {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier: username
    });

    if (!rateLimitResult.allowed) {
      alert(`Too many profile updates. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }

    setIsSaving(true);
    try {
      // Sanitize all data before saving
      const sanitizedBio = sanitizeStrict(bio);
      const finalProfilePic = preview || profilePic;
      const sanitizedProfilePic = finalProfilePic ? sanitizeUrl(finalProfilePic) : null;
      
      // Validate gallery images
      const sanitizedGallery = galleryImages
        .map(url => sanitizeUrl(url))
        .filter((url): url is string => url !== '' && url !== null);

      // Prepare updates
      const updates = {
        bio: sanitizedBio,
        profilePic: sanitizedProfilePic,
        subscriptionPrice,
        galleryImages: sanitizedGallery,
        country: sanitizedCountry,
        isLocationPublic,
      };

      console.log(`[useProfileData] Saving profile for username: "${username}"`, updates);

      // Update profile
      const result = await usersService.updateUserProfile(username, updates);
      
      if (result.success) {
        console.log('[useProfileData] Profile saved successfully');
        
        // Update auth context if profile pic changed
        if (sanitizedProfilePic && sanitizedProfilePic !== user.profilePicture) {
          await updateUser({ profilePicture: sanitizedProfilePic });
        }

        // Update original data
        originalData.current = { ...updates };
        hasUnsavedChanges.current = false;
        
        // Clear preview
        if (preview) {
          setProfilePic(sanitizedProfilePic);
          setPreview(null);
        }

        // Recalculate completeness
        const userResult = await usersService.getUser(username);
        if (userResult.success && userResult.data) {
          // Ensure subscriptionPrice is a string for calculateProfileCompleteness
          const comp = calculateProfileCompleteness(userResult.data, {
            ...result.data!,
            subscriptionPrice: String(result.data!.subscriptionPrice || '0')
          });
          setCompleteness(comp);
        }

        // Track save activity
        await usersService.trackActivity({
          userId: username,
          type: 'profile_update',
          details: { 
            action: 'profile_saved',
            fieldsUpdated: Object.keys(updates),
          },
        });

        return true;
      } else {
        console.error('[useProfileData] Failed to save profile:', result.error);
        alert(result.error?.message || 'Failed to save profile');
        return false;
      }
    } catch (error) {
      console.error('[useProfileData] Error saving profile:', error);
      alert('Failed to save profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update preferences with sanitization
  const updatePreferences = async (updates: any) => {
    if (!user?.username) {
      console.error('[useProfileData] Cannot update preferences: no username');
      return;
    }

    const username = user.username.trim();
    if (!username) {
      console.error('[useProfileData] Cannot update preferences: username is empty');
      return;
    }

    try {
      // Sanitize preference updates
      const sanitizedUpdates = securityService.sanitizeForAPI(updates);
      
      console.log(`[useProfileData] Updating preferences for username: "${username}"`, sanitizedUpdates);
      
      const result = await usersService.updateUserPreferences(username, sanitizedUpdates);
      if (result.success) {
        setPreferences(result.data);
        console.log('[useProfileData] Preferences updated successfully');
      } else {
        console.error('[useProfileData] Failed to update preferences:', result.error);
      }
    } catch (error) {
      console.error('[useProfileData] Error updating preferences:', error);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    console.log('[useProfileData] Refreshing profile data');
    // Clear cache to force fresh data
    usersService.clearCache();
    await loadProfileData();
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Secure bio setter
  const secureBioSetter = (value: string) => {
    // Limit length to prevent DoS
    const truncated = value.slice(0, 600);
    setBio(truncated);
    validateBio(truncated);
  };

  // Secure price setter
  const securePriceSetter = (value: string) => {
    // Remove non-numeric characters except decimal
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) return;
    
    setSubscriptionPrice(cleaned);
    validatePrice(cleaned);
  };

  const secureCountrySetter = (value: string) => {
    const sanitized = sanitizeStrict(value).slice(0, 100);
    setCountry(sanitized);
    setErrors(prev => ({ ...prev, country: undefined }));
  };

  const secureLocationPrivacySetter = (value: boolean) => {
    setIsLocationPublic(Boolean(value));
  };

  return {
    // Profile data
    bio,
    setBio: secureBioSetter,
    profilePic,
    setProfilePic,
    preview,
    setPreview,
    subscriptionPrice,
    setSubscriptionPrice: securePriceSetter,
    country,
    setCountry: secureCountrySetter,
    isLocationPublic,
    setIsLocationPublic: secureLocationPrivacySetter,

    // Gallery
    galleryImages,
    setGalleryImages,
    
    // Profile completeness
    completeness,
    
    // User preferences
    preferences,
    updatePreferences,
    
    // States
    isUploading,
    isLoadingProfile,
    isSaving,
    
    // Actions - handleProfilePicChange now returns void
    handleProfilePicChange,
    removeProfilePic,
    saveProfile,
    refreshProfile,
    
    // Validation
    errors,
  };
}
