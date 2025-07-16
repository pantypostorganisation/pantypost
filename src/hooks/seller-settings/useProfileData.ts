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
  
  // Actions
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Additional features
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [preferences, setPreferences] = useState<any | null>(null);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState<{ bio?: string; subscriptionPrice?: string }>({});
  
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
    if (!user?.username) return;

    setIsLoadingProfile(true);
    try {
      // Get profile data
      const profileResult = await usersService.getUserProfile(user.username);
      
      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data;
        
        // Sanitize loaded data
        const sanitizedBio = sanitizeStrict(profile.bio);
        const sanitizedProfilePic = profile.profilePic ? sanitizeUrl(profile.profilePic) : null;
        
        setBio(sanitizedBio);
        setProfilePic(sanitizedProfilePic);
        setSubscriptionPrice(profile.subscriptionPrice);
        
        // Sanitize gallery URLs
        const sanitizedGallery = (profile.galleryImages || [])
          .map(url => sanitizeUrl(url))
          .filter((url): url is string => url !== '' && url !== null);
        setGalleryImages(sanitizedGallery);
        
        // Store original data for change tracking
        originalData.current = {
          bio: sanitizedBio,
          profilePic: sanitizedProfilePic,
          subscriptionPrice: profile.subscriptionPrice,
          galleryImages: sanitizedGallery,
        };
      }

      // Calculate completeness
      const userResult = await usersService.getUser(user.username);
      if (userResult.success && userResult.data && profileResult.data) {
        const comp = calculateProfileCompleteness(userResult.data, profileResult.data);
        setCompleteness(comp);
      }

      // Load preferences
      const prefsResult = await usersService.getUserPreferences(user.username);
      if (prefsResult.success) {
        setPreferences(prefsResult.data);
      }

      // Track profile view activity
      await usersService.trackActivity({
        userId: user.username,
        type: 'profile_update',
        details: { action: 'profile_settings_viewed' },
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user?.username]);

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Track changes
  useEffect(() => {
    hasUnsavedChanges.current = 
      bio !== originalData.current.bio ||
      profilePic !== originalData.current.profilePic ||
      subscriptionPrice !== originalData.current.subscriptionPrice ||
      JSON.stringify(galleryImages) !== JSON.stringify(originalData.current.galleryImages);
  }, [bio, profilePic, subscriptionPrice, galleryImages]);

  // Handle profile picture change with security
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check rate limit
    if (user?.username) {
      const rateLimitResult = rateLimiter.check('IMAGE_UPLOAD', {
        ...RATE_LIMITS.IMAGE_UPLOAD,
        identifier: user.username
      });

      if (!rateLimitResult.allowed) {
        alert(`Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.`);
        return;
      }
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
      console.log('Profile pic uploaded successfully:', result);
      
      // Validate uploaded URL
      const sanitizedUrl = sanitizeUrl(result.url);
      if (!sanitizedUrl) {
        throw new Error('Invalid image URL returned');
      }
      
      // Set the preview
      setPreview(sanitizedUrl);
      
      // Track upload activity
      await usersService.trackActivity({
        userId: user?.username || '',
        type: 'profile_update',
        details: { action: 'profile_picture_uploaded' },
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove profile picture
  const removeProfilePic = () => {
    setProfilePic(null);
    setPreview(null);
  };

  // Save profile with optimistic update and security
  const saveProfile = async (): Promise<boolean> => {
    if (!user?.username) return false;

    // Validate all fields
    const isBioValid = validateBio(bio);
    const isPriceValid = validatePrice(subscriptionPrice);
    
    if (!isBioValid || !isPriceValid) {
      return false;
    }

    // Check rate limit for profile saves
    const rateLimitResult = rateLimiter.check('PROFILE_UPDATE', {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier: user.username
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
      };

      // Update profile
      const result = await usersService.updateUserProfile(user.username, updates);
      
      if (result.success) {
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
        const userResult = await usersService.getUser(user.username);
        if (userResult.success && userResult.data) {
          const comp = calculateProfileCompleteness(userResult.data, result.data!);
          setCompleteness(comp);
        }

        // Track save activity
        await usersService.trackActivity({
          userId: user.username,
          type: 'profile_update',
          details: { 
            action: 'profile_saved',
            fieldsUpdated: Object.keys(updates),
          },
        });

        return true;
      } else {
        alert(result.error?.message || 'Failed to save profile');
        return false;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update preferences with sanitization
  const updatePreferences = async (updates: any) => {
    if (!user?.username) return;

    try {
      // Sanitize preference updates
      const sanitizedUpdates = securityService.sanitizeForAPI(updates);
      
      const result = await usersService.updateUserPreferences(user.username, sanitizedUpdates);
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
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
    
    // Actions
    handleProfilePicChange,
    removeProfilePic,
    saveProfile,
    refreshProfile,
    
    // Validation
    errors,
  };
}