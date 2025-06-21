// src/hooks/seller-settings/useProfileData.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { uploadToCloudinary } from '@/utils/cloudinary';

export function useProfileData() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

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

  // Handle profile picture change with Cloudinary
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);
      console.log('Profile pic uploaded successfully:', result);
      
      // Set the preview to the Cloudinary URL
      setPreview(result.url);
      
      // You might want to save immediately or wait for user to click save
      // For now, we'll just set the preview
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

  return {
    bio,
    setBio,
    profilePic,
    setProfilePic,
    preview,
    setPreview,
    subscriptionPrice,
    setSubscriptionPrice,
    isUploading,
    handleProfilePicChange,
    removeProfilePic
  };
}
