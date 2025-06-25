// src/hooks/seller-settings/useProfileData.enhanced.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { ProfileCompleteness, calculateProfileCompleteness } from '@/types/users';

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

  // Validate bio
  const validateBio = useCallback((value: string) => {
    if (value.length > 500) {
      setErrors(prev => ({ ...prev, bio: 'Bio must be less than 500 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, bio: undefined }));
    return true;
  }, []);

  // Validate subscription price
  const validatePrice = useCallback((value: string) => {
    const pattern = /^\d+(\.\d{1,2})?$/;
    const numValue = parseFloat(value);
    
    if (!pattern.test(value) || numValue < 0 || numValue > 999.99) {
      setErrors(prev => ({ 
        ...prev, 
        subscriptionPrice: 'Price must be between $0 and $999.99' 
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
        setBio(profile.bio);
        setProfilePic(profile.profilePic);
        setSubscriptionPrice(profile.subscriptionPrice);
        setGalleryImages(profile.galleryImages || []);
        
        // Store original data for change tracking
        originalData.current = {
          bio: profile.bio,
          profilePic: profile.profilePic,
          subscriptionPrice: profile.subscriptionPrice,
          galleryImages: profile.galleryImages || [],
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

  // Handle profile picture change
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);
      console.log('Profile pic uploaded successfully:', result);
      
      // Set the preview
      setPreview(result.url);
      
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

  // Save profile with optimistic update
  const saveProfile = async (): Promise<boolean> => {
    if (!user?.username) return false;

    // Validate all fields
    const isBioValid = validateBio(bio);
    const isPriceValid = validatePrice(subscriptionPrice);
    
    if (!isBioValid || !isPriceValid) {
      return false;
    }

    setIsSaving(true);
    try {
      // Prepare updates
      const updates = {
        bio,
        profilePic: preview || profilePic,
        subscriptionPrice,
        galleryImages,
      };

      // Update profile
      const result = await usersService.updateUserProfile(user.username, updates);
      
      if (result.success) {
        // Update auth context if profile pic changed
        if (preview && preview !== user.profilePicture) {
          await updateUser({ profilePicture: preview });
        }

        // Update original data
        originalData.current = { ...updates };
        hasUnsavedChanges.current = false;
        
        // Clear preview
        if (preview) {
          setProfilePic(preview);
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

  // Update preferences
  const updatePreferences = async (updates: any) => {
    if (!user?.username) return;

    try {
      const result = await usersService.updateUserPreferences(user.username, updates);
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

  return {
    // Profile data
    bio,
    setBio: (value: string) => {
      setBio(value);
      validateBio(value);
    },
    profilePic,
    setProfilePic,
    preview,
    setPreview,
    subscriptionPrice,
    setSubscriptionPrice: (value: string) => {
      setSubscriptionPrice(value);
      validatePrice(value);
    },
    
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