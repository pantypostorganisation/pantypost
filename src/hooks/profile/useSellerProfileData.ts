// src/hooks/profile/useSellerProfileData.ts
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { getUserProfileData } from '@/utils/profileUtils';

export function useSellerProfileData(username: string) {
  const { user } = useAuth();
  const { listings, users, subscriptions } = useListings();
  const { orderHistory } = useWallet();

  // Profile state
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Load profile data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load profile data using the utility function
      const profileData = getUserProfileData(username);
      if (profileData) {
        setBio(profileData.bio);
        setProfilePic(profileData.profilePic);
        setSubscriptionPrice(parseFloat(profileData.subscriptionPrice) || null);
      }
      
      // Gallery is already in localStorage
      const storedGallery = localStorage.getItem(`profile_gallery_${username}`);
      if (storedGallery) {
        try {
          const parsedGallery = JSON.parse(storedGallery);
          if (Array.isArray(parsedGallery)) {
            setGalleryImages(parsedGallery);
          } else {
            setGalleryImages([]);
          }
        } catch (error) {
          console.error('Failed to parse stored gallery data:', error);
          setGalleryImages([]);
        }
      } else {
        setGalleryImages([]);
      }
    }
  }, [username]);

  // Computed values
  const sellerUser = users?.[username];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
  
  const sellerListings = listings.filter(listing => listing.seller === username);
  const totalPhotos = sellerListings.filter(listing => listing.imageUrls && listing.imageUrls.length > 0).length;
  const totalVideos = 0;

  const followers = Object.entries(subscriptions)
    .filter(([_, sellers]) => Array.isArray(sellers) && sellers.includes(username))
    .length;

  const sellerTierInfo = useMemo(() => {
    return getSellerTierMemoized(username, orderHistory);
  }, [username, orderHistory]);

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
  };
}
