// src/hooks/seller-settings/useProfileData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useProfileData() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>('');

  // Load profile data on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      const storedBio = sessionStorage.getItem(`profile_bio_${user.username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${user.username}`);
      const storedSubPrice = sessionStorage.getItem(`subscription_price_${user.username}`);

      if (storedBio) setBio(storedBio);
      if (storedPic) {
        setProfilePic(storedPic);
        setPreview(storedPic);
      }
      if (storedSubPrice) setSubscriptionPrice(storedSubPrice);
    }
  }, [user?.username]);

  // Handle profile picture change
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setProfilePic(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove profile picture
  const removeProfilePic = () => {
    setProfilePic(null);
    setPreview(null);
  };

  return {
    bio,
    setBio,
    profilePic,
    preview,
    subscriptionPrice,
    setSubscriptionPrice,
    handleProfilePicChange,
    removeProfilePic
  };
}
