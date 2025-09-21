// src/hooks/profile/useSellerProfileData.ts

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService } from '@/services';
import {
  sanitizeUsername,
  sanitizeStrict,
  sanitizeUrl,
} from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

// Dynamic API URL that works on local network
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname.match(/192\.168\.|10\.|172\./)
  ? `http://${window.location.hostname}:5000/api`
  : 'http://localhost:5000/api';

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

  // Tier info (memoized utility call)
  const sellerTierInfo = sanitizedUsername
    ? getSellerTierMemoized(sanitizedUsername, orderHistory)
    : null;

  // Stats
  const totalPhotos = galleryImages.length;
  const totalVideos = 0; // future support
  const followers = sellerUser?.subscriberCount || 0;

  useEffect(() => {
    const loadProfileData = async () => {
      if (!sanitizedUsername) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const apiUrl = `${API_BASE_URL}/users/${sanitizedUsername}/profile`;

        // Only read localStorage in browser
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('authToken')
            : null;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // not found: fall back below
          } else {
            throw new Error(`Failed to fetch profile: ${response.statusText}`);
          }
        } else {
          const data = await response.json();
          if (data?.success && data.data) {
            const profileData = data.data;

            // Core user fields
            setSellerUser({
              username: profileData.username,
              isVerified: profileData.isVerified,
              tier: profileData.tier,
              subscriberCount: profileData.subscriberCount || 0,
              totalSales: profileData.totalSales || 0,
              rating: profileData.rating || 0,
              reviewCount: profileData.reviewCount || 0,
              role: profileData.role,
            });

            setIsVerified(!!profileData.isVerified);

            // Sanitize bio
            setBio(sanitizeStrict(profileData.bio || ''));

            // Sanitize profile pic URL
            const sanitizedPic = profileData.profilePic
              ? sanitizeUrl(profileData.profilePic)
              : null;
            setProfilePic(sanitizedPic);

            // Subscription price (validate if possible)
            if (
              profileData.subscriptionPrice !== undefined &&
              profileData.subscriptionPrice !== null
            ) {
              const rawPrice =
                typeof profileData.subscriptionPrice === 'string'
                  ? parseFloat(profileData.subscriptionPrice)
                  : profileData.subscriptionPrice;

              const validated = securityService.validateAmount(rawPrice, {
                min: 1,
                max: 1000,
              });

              setSubscriptionPrice(
                validated.valid && validated.value != null
                  ? validated.value
                  : rawPrice
              );
            } else {
              setSubscriptionPrice(null);
            }

            // Gallery
            if (Array.isArray(profileData.galleryImages)) {
              const validated = profileData.galleryImages
                .map((url: string) => sanitizeUrl(url))
                .filter((u: string | null): u is string => !!u && u.length > 0);
              setGalleryImages(validated);
            } else {
              // fallback to local storage
              const key = `profile_gallery_${sanitizedUsername}`;
              const stored =
                (await storageService.getItem<string[]>(key, [])) || [];
              const validated = stored
                .map((url) => sanitizeUrl(url))
                .filter((u: string | null): u is string => !!u && u.length > 0);
              setGalleryImages(validated);
            }

            setIsLoading(false);
            return;
          }
        }

        // Fallback to users context when API failed or not found
        const fallbackUser = users?.[sanitizedUsername];
        if (fallbackUser) {
          setSellerUser(fallbackUser);
          setIsVerified(
            fallbackUser.isVerified ||
              fallbackUser.verificationStatus === 'verified' ||
              false
          );
          setBio(sanitizeStrict(fallbackUser.bio || ''));
          setProfilePic(
            fallbackUser.profilePic ? sanitizeUrl(fallbackUser.profilePic) : null
          );
          setSubscriptionPrice(null);

          // Optional: local gallery fallback
          const key = `profile_gallery_${sanitizedUsername}`;
          const stored =
            (await storageService.getItem<string[]>(key, [])) || [];
          const validated = stored
            .map((url) => sanitizeUrl(url))
            .filter((u: string | null): u is string => !!u && u.length > 0);
          setGalleryImages(validated);
        } else {
          // Reset
          setBio('');
          setProfilePic(null);
          setSubscriptionPrice(null);
          setGalleryImages([]);
          setSellerUser(null);
          setIsVerified(false);
        }
      } catch (err) {
        console.error('Error loading seller profile data:', err);
        // Fallback path mirrors above
        const fallbackUser = users?.[sanitizedUsername];
        if (fallbackUser) {
          setSellerUser(fallbackUser);
          setIsVerified(
            fallbackUser.isVerified ||
              fallbackUser.verificationStatus === 'verified' ||
              false
          );
          setBio(sanitizeStrict(fallbackUser.bio || ''));
          setProfilePic(
            fallbackUser.profilePic ? sanitizeUrl(fallbackUser.profilePic) : null
          );
          setSubscriptionPrice(null);
        } else {
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
  }, [sanitizedUsername, users]);

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
    isLoading,
  };
};
