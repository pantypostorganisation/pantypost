// src/hooks/profile/useSellerProfileData.ts

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService } from '@/services';
import { sanitizeUsername, sanitizeStrict, sanitizeUrl } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

const API_BASE_URL = 'http://localhost:5000/api';

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
  
  // Additional profile data
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Sanitize username
  const sanitizedUsername = username ? sanitizeUsername(username) : undefined;
  
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

      console.log('[useSellerProfileData] Loading profile for:', sanitizedUsername);
      setIsLoading(true);
      
      try {
        // Fetch profile data from the backend API
        const apiUrl = `${API_BASE_URL}/users/${sanitizedUsername}/profile`;
        console.log('[useSellerProfileData] Fetching from:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Include auth token if available for full profile access
            ...(localStorage.getItem('authToken') && {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            })
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log('Profile not found for:', sanitizedUsername);
          } else {
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          console.log('[useSellerProfileData] API Response:', data);
          
          if (data.success && data.data) {
            const profileData = data.data;
            console.log('[useSellerProfileData] Profile data:', {
              username: profileData.username,
              subscriptionPrice: profileData.subscriptionPrice,
              bio: profileData.bio
            });
            
            // Set seller user data
            setSellerUser({
              username: profileData.username,
              isVerified: profileData.isVerified,
              tier: profileData.tier,
              subscriberCount: profileData.subscriberCount || 0,
              totalSales: profileData.totalSales || 0,
              rating: profileData.rating || 0,
              reviewCount: profileData.reviewCount || 0,
              role: profileData.role
            });
            
            // Set verification status
            setIsVerified(profileData.isVerified || false);
            
            // Sanitize bio to prevent XSS
            const sanitizedBio = sanitizeStrict(profileData.bio || '');
            setBio(sanitizedBio);
            
            // Validate profile picture URL
            const sanitizedProfilePic = profileData.profilePic ? sanitizeUrl(profileData.profilePic) : null;
            setProfilePic(sanitizedProfilePic);
            
            // Set subscription price directly from API
            if (profileData.subscriptionPrice !== undefined && profileData.subscriptionPrice !== null) {
              // Convert string to number if needed
              const price = typeof profileData.subscriptionPrice === 'string' 
                ? parseFloat(profileData.subscriptionPrice) 
                : profileData.subscriptionPrice;
              
              // Validate the price
              const validatedPrice = securityService.validateAmount(price, { min: 1, max: 1000 });
              
              if (validatedPrice.valid && validatedPrice.value) {
                setSubscriptionPrice(validatedPrice.value);
              } else {
                setSubscriptionPrice(price); // Use the raw value if validation fails but it exists
              }
            } else {
              setSubscriptionPrice(null);
            }
            
            // Set gallery images if provided
            if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
              const validatedGallery = profileData.galleryImages
                .map((url: string) => sanitizeUrl(url))
                .filter((url: string | null): url is string => url !== '' && url !== null);
              setGalleryImages(validatedGallery);
            } else {
              // Fallback to localStorage for gallery images
              const galleryKey = `profile_gallery_${sanitizedUsername}`;
              const storedGallery = await storageService.getItem<string[]>(galleryKey, []);
              const validatedGallery = storedGallery
                .map((url: string) => sanitizeUrl(url))
                .filter((url: string | null): url is string => url !== '' && url !== null);
              setGalleryImages(validatedGallery);
            }
          }
        }
      } catch (error) {
        console.error('Error loading seller profile data:', error);
        
        // Try to fall back to users context data if API fails
        const fallbackUser = users?.[sanitizedUsername];
        if (fallbackUser) {
          setSellerUser(fallbackUser);
          setIsVerified(fallbackUser.isVerified || fallbackUser.verificationStatus === 'verified' || false);
          setBio(sanitizeStrict(fallbackUser.bio || ''));
          setProfilePic(fallbackUser.profilePic ? sanitizeUrl(fallbackUser.profilePic) : null);
          
          // For subscription price, we might not have it in the users context
          // So keep it null if not available
          setSubscriptionPrice(null);
        } else {
          // Reset to defaults on error
          setBio('');
          setProfilePic(null);
          setSubscriptionPrice(null);
          setGalleryImages([]);
          setSellerUser(null);
          setIsVerified(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [sanitizedUsername, users]); // Re-fetch when username changes

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
