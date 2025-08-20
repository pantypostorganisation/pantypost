// src/hooks/seller-settings/useProfileSettings.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; // Fixed path
import { useToast } from '@/context/ToastContext'; // Use your custom toast
import { TierLevel } from '@/utils/sellerTiers'; // Import the actual TierLevel type

interface TierProgress {
  salesProgress: number;
  revenueProgress: number;
}

export function useProfileSettings() {
  const { user, apiClient, getAuthToken } = useAuth(); // Use your auth context
  const toast = useToast(); // Use your toast context
  
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [preview, setPreview] = useState('');
  
  // Upload state
  const [profileUploading, setProfileUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Save state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined); // Changed from null to undefined
  const [isSaving, setIsSaving] = useState(false);
  
  // Tier info
  const [sellerTierInfo, setSellerTierInfo] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>({
    totalSales: 0,
    totalRevenue: 0,
    subscribers: 0
  }); // Initialize with correct property names
  const [selectedTierDetails, setSelectedTierDetails] = useState<any>(null);

  // Load profile data on mount
  useEffect(() => {
    if (user?.username) {
      loadProfile();
    }
  }, [user?.username]);

  const loadProfile = async () => {
    if (!user?.username) return;
    
    try {
      // Use the full profile endpoint for authenticated users
      const response = await apiClient.get(`/users/${user.username}/profile/full`);
      
      if (response.success && response.data) {
        setBio(response.data.bio || '');
        setProfilePic(response.data.profilePic || '');
        setPreview(response.data.profilePic || '');
        setSubscriptionPrice(response.data.subscriptionPrice || '');
        setGalleryImages(response.data.galleryImages || []);
        
        // Set tier info if available
        if (response.data.tier) {
          setSellerTierInfo({ 
            tier: response.data.tier || 'Tease',
            isVerified: response.data.isVerified || false,
            subscriberCount: response.data.subscriberCount || 0,
            totalSales: response.data.totalSales || 0,
            rating: response.data.rating || 0,
            reviewCount: response.data.reviewCount || 0
          });
          
          // Set user stats with proper defaults
          setUserStats({
            totalSales: response.data.totalSales || 0,
            totalRevenue: response.data.totalRevenue || 0,
            subscribers: response.data.subscriberCount || 0
          });
        } else {
          // Set default tier info if not provided
          setSellerTierInfo({ 
            tier: 'Tease',
            isVerified: false,
            subscriberCount: 0,
            totalSales: 0,
            rating: 0,
            reviewCount: 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Don't show error toast for initial load failures
    }
  };

  // Handle profile picture change
  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, create a local preview
    // In production, you'd upload to Cloudinary/S3 here
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfilePic(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
    
    // TODO: Implement actual image upload
    // setProfileUploading(true);
    // try {
    //   const uploadedUrl = await uploadImage(file);
    //   setProfilePic(uploadedUrl);
    //   setPreview(uploadedUrl);
    // } catch (error) {
    //   toast.error('Failed to upload image');
    // } finally {
    //   setProfileUploading(false);
    // }
  };

  const removeProfilePic = () => {
    setProfilePic('');
    setPreview('');
  };

  // Handle gallery images
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const uploadGalleryImages = async () => {
    if (selectedFiles.length === 0) return;

    // For now, convert to base64 for local preview
    // In production, upload to your image service
    const newImages: string[] = [];
    
    for (const file of selectedFiles) {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(result);
    }
    
    setGalleryImages(prev => [...prev, ...newImages]);
    setSelectedFiles([]);
    toast.success('Gallery images added');
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllGalleryImages = () => {
    setGalleryImages([]);
  };

  // MAIN SAVE FUNCTION - Using your apiClient
  const handleSave = async () => {
    if (!user?.username) {
      const error = 'User not authenticated';
      setSaveError(error);
      toast.error('Authentication Error', error);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(undefined); // Changed from null to undefined

    try {
      // Prepare the data according to API spec
      const profileData = {
        bio: bio.trim(),
        profilePic: profilePic,
        subscriptionPrice: subscriptionPrice.toString(),
        galleryImages: galleryImages
      };

      console.log('Saving profile with data:', profileData);

      // Use apiClient from AuthContext
      const response = await apiClient.patch(
        `/users/${user.username}/profile`,
        profileData
      );

      console.log('Save response:', response);

      if (response.success && response.data) {
        setSaveSuccess(true);
        setSaveError(undefined); // Changed from null to undefined
        toast.success('Success', 'Profile updated successfully!');
        
        // Update local state with response data
        setBio(response.data.bio || '');
        setProfilePic(response.data.profilePic || '');
        setSubscriptionPrice(response.data.subscriptionPrice || '');
        setGalleryImages(response.data.galleryImages || []);
        
        // Update tier info if returned
        if (response.data.tier) {
          setSellerTierInfo({ 
            tier: response.data.tier,
            isVerified: response.data.isVerified,
            subscriberCount: response.data.subscriberCount || 0,
            totalSales: response.data.totalSales || 0,
            rating: response.data.rating || 0,
            reviewCount: response.data.reviewCount || 0
          });
          
          // Update user stats with correct property names
          setUserStats({
            totalSales: response.data.totalSales || 0,
            totalRevenue: response.data.totalRevenue || 0,
            subscribers: response.data.subscriberCount || 0
          });
        }
        
        // Hide success indicator after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
        
        // Reload profile to ensure we have the latest data
        setTimeout(() => {
          loadProfile();
        }, 500);
      } else {
        const errorMsg = response.error?.message || 'Failed to update profile';
        setSaveError(errorMsg);
        toast.error('Update Failed', errorMsg);
      }
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save profile';
      setSaveError(errorMsg);
      toast.error('Error', errorMsg);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Tier helper functions with proper types
  const getTierProgress = (): TierProgress => {
    // Calculate based on your tier requirements from TIER_LEVELS
    let salesTarget = 10; // Default to Flirt requirement
    let revenueTarget = 5000; // Default to Flirt requirement
    
    // Determine targets based on current tier
    if (sellerTierInfo?.tier) {
      switch (sellerTierInfo.tier) {
        case 'None':
        case 'Tease':
          salesTarget = 10; // To reach Flirt
          revenueTarget = 5000;
          break;
        case 'Flirt':
          salesTarget = 101; // To reach Obsession
          revenueTarget = 12500;
          break;
        case 'Obsession':
          salesTarget = 251; // To reach Desire
          revenueTarget = 75000;
          break;
        case 'Desire':
          salesTarget = 1001; // To reach Goddess
          revenueTarget = 150000;
          break;
        case 'Goddess':
          // Already at max tier - show 100% progress
          return {
            salesProgress: 100,
            revenueProgress: 100
          };
      }
    }
    
    // Ensure we have valid numbers - use totalSales and totalRevenue
    const currentSales = userStats?.totalSales || 0;
    const currentRevenue = userStats?.totalRevenue || 0;
    
    const salesProgress = salesTarget > 0 ? (currentSales / salesTarget) * 100 : 0;
    const revenueProgress = revenueTarget > 0 ? (currentRevenue / revenueTarget) * 100 : 0;
    
    return {
      salesProgress: Math.min(Math.max(0, salesProgress), 100), // Ensure between 0 and 100
      revenueProgress: Math.min(Math.max(0, revenueProgress), 100) // Ensure between 0 and 100
    };
  };

  const getNextTier = (currentTier: string): TierLevel => {
    // Match the exact TierLevel type from @/utils/sellerTiers
    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tiers.indexOf(currentTier as TierLevel);
    
    if (currentIndex === -1) {
      // If current tier is not found or 'None', return 'Tease' as the first tier
      return 'Tease';
    }
    
    if (currentIndex === tiers.length - 1) {
      // Already at highest tier
      return 'Goddess';
    }
    
    return tiers[currentIndex + 1];
  };

  return {
    // User
    user,
    
    // Profile data
    bio,
    setBio,
    profilePic,
    preview,
    subscriptionPrice,
    setSubscriptionPrice,
    profileUploading,
    handleProfilePicChange,
    removeProfilePic,
    
    // Gallery
    galleryImages,
    selectedFiles,
    galleryUploading,
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages,
    
    // Tier info
    sellerTierInfo,
    userStats,
    getTierProgress,
    getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,
    
    // Save functionality
    saveSuccess,
    saveError, // Added this
    isSaving, // Changed from 'saving' to 'isSaving'
    handleSave,
  };
}