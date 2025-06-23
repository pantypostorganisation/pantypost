// src/hooks/profile/useSellerProfileData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService } from '@/services';

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
  
  // Get seller user data
  const sellerUser = username ? users?.[username] : null;
  const isVerified = sellerUser?.isVerified || sellerUser?.verificationStatus === 'verified' || false;
  
  // Get seller tier info
  const sellerTierInfo = username ? getSellerTierMemoized(username, orderHistory) : null;
  
  // Calculate stats
  const totalPhotos = galleryImages.length;
  const totalVideos = 0; // Placeholder for future video support
  const followers = sellerUser?.subscriberCount || 0;

  useEffect(() => {
    const loadProfileData = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const profileData = await getUserProfileData(username);
        if (profileData) {
          setBio(profileData.bio);
          setProfilePic(profileData.profilePic);
          setSubscriptionPrice(parseFloat(profileData.subscriptionPrice) || null);
        } else {
          // Reset to defaults if no profile data
          setBio('');
          setProfilePic(null);
          setSubscriptionPrice(null);
        }
        
        // Load gallery images from localStorage using storageService
        const galleryKey = `profile_gallery_${username}`;
        const storedGallery = await storageService.getItem<string[]>(galleryKey, []);
        setGalleryImages(storedGallery);
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
  }, [username]);

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