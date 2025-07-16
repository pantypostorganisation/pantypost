// src/hooks/profile/useSellerProfileData.ts

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService } from '@/services';
import { sanitizeUsername, sanitizeStrict, sanitizeUrl, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

export const useSellerProfileData = (username: string | undefined) => {
  const { user } = useAuth();
  const { users, orderHistory } = useListings();
  
  // Basic profile data
  const [bio, setBio] = useState<string>('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Gallery data
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Sanitize username
  const sanitizedUsername = username ? sanitizeUsername(username) : undefined;
  
  // Get seller user data
  const sellerUser = sanitizedUsername ? users?.[sanitizedUsername] : null;
  const isVerified = sellerUser?.isVerified || sellerUser?.verificationStatus === 'verified' || false;
  
  // Get seller tier info
  const sellerTierInfo = sanitizedUsername ? getSellerTierMemoized(sanitizedUsername, orderHistory) : null;
  
  // Calculate stats
  const totalPhotos = galleryImages.length;
  const totalVideos = 0; // Placeholder for future video support
  const followers = sellerUser?.subscriberCount || 0;

  useEffect(() => {
    const loadProfileData = async () => {
      if (!sanitizedUsername) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const profileData = await getUserProfileData(sanitizedUsername);
        
        if (profileData) {
          // Sanitize bio to prevent XSS
          const sanitizedBio = sanitizeStrict(profileData.bio);
          setBio(sanitizedBio);
          
          // Validate profile picture URL
          const sanitizedProfilePic = profileData.profilePic ? sanitizeUrl(profileData.profilePic) : null;
          setProfilePic(sanitizedProfilePic);
          
          // Validate and sanitize subscription price
          const validatedPrice = securityService.validateAmount(
            profileData.subscriptionPrice,
            { min: 1, max: 1000 }
          );
          
          if (validatedPrice.valid && validatedPrice.value) {
            setSubscriptionPrice(validatedPrice.value);
          } else {
            setSubscriptionPrice(null);
          }
        } else {
          // Reset to defaults if no profile data
          setBio('');
          setProfilePic(null);
          setSubscriptionPrice(null);
        }
        
        // Load gallery images from localStorage using storageService
        const galleryKey = `profile_gallery_${sanitizedUsername}`;
        const storedGallery = await storageService.getItem<string[]>(galleryKey, []);
        
        // Validate each gallery image URL
        const validatedGallery = storedGallery
          .map(url => sanitizeUrl(url))
          .filter((url): url is string => url !== '' && url !== null);
          
        setGalleryImages(validatedGallery);
        
      } catch (error) {
        console.error('Error loading seller profile data:', error);
        // Reset to defaults on error
        setBio('');
        setProfilePic(null);
        setSubscriptionPrice(null);
        setGalleryImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [sanitizedUsername]);

  return {
    // User data
    user,
    sellerUser,
    isVerified,
    
    // Profile data
    bio,
    profilePic,
    subscriptionPrice,
    galleryImages,
    sellerTierInfo,
    
    // Stats
    totalPhotos,
    totalVideos,
    followers,
    
    // Loading state
    isLoading
  };
};
