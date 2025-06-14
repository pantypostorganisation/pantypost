// src/hooks/seller-settings/useProfileData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileData } from '@/utils/profileUtils';

// Image compression utility
const compressImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export function useProfileData() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>('');

  // Load profile data on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      // Load profile data using the utility function
      const profileData = getUserProfileData(user.username);
      if (profileData) {
        setBio(profileData.bio);
        setProfilePic(profileData.profilePic);
        setSubscriptionPrice(profileData.subscriptionPrice);
      }
    }
  }, [user?.username]);

  // Handle profile picture change
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 500);
        setPreview(compressed);
      } catch (error) {
        console.error("Error compressing profile image:", error);
        alert("Failed to process image. Please try a different one.");
      }
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
    setProfilePic,
    preview,
    setPreview,
    subscriptionPrice,
    setSubscriptionPrice,
    handleProfilePicChange,
    removeProfilePic
  };
}
