'use client';

import { useListings } from '@/context/ListingContext';
import { useEffect, useState, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { Upload, X, ImageIcon, Trash2, Save, PlusCircle, Image as ImageLucide, Award, TrendingUp } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { getSellerTierMemoized, TIER_LEVELS, TierLevel } from '@/utils/sellerTiers';

export default function SellerProfileSettingsPage() {
  const { user } = useListings();
  const { orderHistory } = useWallet();
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Calculate seller tier for display
  const sellerTierInfo = user ? getSellerTierMemoized(user.username, orderHistory) : null;

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      const storedBio = sessionStorage.getItem(`profile_bio_${user.username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${user.username}`);
      const storedSubPrice = sessionStorage.getItem(`subscription_price_${user.username}`);
      // Use localStorage for gallery images
      const storedGallery = localStorage.getItem(`profile_gallery_${user.username}`);

      if (storedBio) setBio(storedBio);
      if (storedPic) setProfilePic(storedPic);
      if (storedSubPrice) setSubscriptionPrice(storedSubPrice);
      if (storedGallery) {
        try {
          const parsedGallery = JSON.parse(storedGallery);
          if (Array.isArray(parsedGallery)) {
             setGalleryImages(parsedGallery);
          } else {
             console.error('Stored gallery data is not an array:', parsedGallery);
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
  }, [user]);

  // Main save function for all profile data (bio, sub price, profile pic, and current gallery state)
  const handleSave = () => {
    if (!user?.username) return;

    sessionStorage.setItem(`profile_bio_${user.username}`, bio);
    sessionStorage.setItem(`subscription_price_${user.username}`, subscriptionPrice || '0');
    // Save current galleryImages state
    localStorage.setItem(`profile_gallery_${user.username}`, JSON.stringify(galleryImages));

    if (preview) {
      sessionStorage.setItem(`profile_pic_${user.username}`, preview);
      setProfilePic(preview); // Update state
      setPreview(null); // Clear preview
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper function to save profile data, specifically using a passed gallery array
  const handleSaveWithGallery = (currentGallery: string[]) => {
     if (!user?.username) return;

     sessionStorage.setItem(`profile_bio_${user.username}`, bio);
     sessionStorage.setItem(`subscription_price_${user.username}`, subscriptionPrice || '0');
     // Use the passed currentGallery array for saving
     localStorage.setItem(`profile_gallery_${user.username}`, JSON.stringify(currentGallery));

     if (preview) {
       sessionStorage.setItem(`profile_pic_${user.username}`, preview);
       setProfilePic(preview); // Update state
       setPreview(null); // Clear preview
     }

     setSaveSuccess(true);
     setTimeout(() => setSaveSuccess(false), 3000);
  };


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

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, 500).then((compressed) => {
        setPreview(compressed);
      }).catch(error => {
        console.error("Error compressing profile image:", error);
        alert("Failed to process image. Please try a different one.");
      });
    }
  };

  const handleMultipleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const compressPromises = selectedFiles.map(file => compressImage(file));
      const compressedImages = await Promise.all(compressPromises);

      const updatedGallery = [...galleryImages, ...compressedImages];
      setGalleryImages(updatedGallery); // Update state
      handleSaveWithGallery(updatedGallery); // Auto-save with the new gallery

      setSelectedFiles([]);
    } catch (error) {
      console.error("Error processing images:", error);
      alert("Failed to process one or more images. Please try again with different files.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery); // Update state
    handleSaveWithGallery(updatedGallery); // Auto-save after removing
  };

  const clearAllGalleryImages = () => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      setGalleryImages([]); // Update state
      handleSaveWithGallery([]); // Auto-save after clearing
    }
  };

  // Function to get the next tier name
  const getNextTier = (currentTier: TierLevel): TierLevel => {
    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return currentTier; // Either not found or already at highest tier
    }
    return tiers[currentIndex + 1];
  };

  return (
    <RequireAuth role="seller">
      <main className="min-h-screen bg-black text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-[#ff950e]">My Profile</h1>
          <p className="text-gray-400 mb-8">Manage your seller profile and photo gallery</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Profile info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold mb-6 text-white">Profile Info</h2>

                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden mb-4 shadow-lg relative group">
                    {preview || profilePic ? (
                      <img
                        src={preview || profilePic || ''}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold">
                        {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}

                    <div
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      onClick={() => profilePicInputRef.current?.click()}
                    >
                      <div className="text-white text-xs font-medium bg-[#ff950e] rounded-full px-3 py-1">
                        Change Photo
                      </div>
                    </div>
                  </div>

                  <input
                    ref={profilePicInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => profilePicInputRef.current?.click()}
                    className="text-sm text-[#ff950e] hover:text-white transition"
                  >
                    Upload New Picture
                  </button>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 resize-none"
                    placeholder="Tell buyers about yourself..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {bio.length}/500 - Describe yourself, your style, and what makes your items special
                  </p>
                </div>

                {/* Subscription Price */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subscription Price ($/month)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-400">$</span>
                    </div>
                    <input
                      id="subscriptionPrice"
                      name="subscriptionPrice"
                      type="number"
                      value={subscriptionPrice}
                      onChange={(e) => setSubscriptionPrice(e.target.value)}
                      className="w-full pl-8 p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                      placeholder="19.99"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This is what buyers will pay to access your premium content
                  </p>
                </div>
              </div>

              {/* Save Button - For Bio, Subscription Price, and Profile Pic */}
              <button
                onClick={handleSave}
                className="w-full bg-[#ff950e] text-black px-6 py-3 rounded-lg hover:bg-[#e0850d] font-bold text-lg transition flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save All Profile Changes
              </button>

              {saveSuccess && (
                <div className="bg-green-900 text-green-100 p-3 rounded-lg mt-3 text-center">
                  ✅ Profile updated successfully!
                </div>
              )}
            </div>

            {/* Right column - Photo Gallery */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <ImageLucide className="w-5 h-5 mr-2 text-[#ff950e]" />
                    Photo Gallery
                  </h2>

                  <div className="flex gap-2">
                    {galleryImages.length > 0 && (
                      <button
                        onClick={clearAllGalleryImages}
                        className="text-xs px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white rounded-full transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                  Add photos to your public gallery. These will be visible to all visitors on your profile page. Gallery changes are saved automatically.
                </p>

                {/* File Selection & Upload */}
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex-1">
                      <label
                        htmlFor="gallery-upload"
                        className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer w-full"
                      >
                        <input
                          id="gallery-upload"
                          ref={multipleFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultipleImagesSelect}
                          className="hidden"
                        />
                        <PlusCircle className="w-5 h-5 text-[#ff950e]" />
                        <span className="text-gray-300">Select multiple images...</span>
                      </label>
                    </div>

                    <button
                      onClick={handleUploadAll}
                      disabled={selectedFiles.length === 0 || isUploading}
                      className={`px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                        selectedFiles.length === 0 || isUploading
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ff950e] text-black hover:bg-[#e0850d]'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Processing...' : `Add to Gallery (${selectedFiles.length})`}
                    </button>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Images:</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group border border-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Selected ${index + 1}`}
                              className="w-full h-28 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2 text-xs text-white truncate">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Gallery */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                    Your Gallery ({galleryImages.length} photos)
                  </h3>

                  {galleryImages.length === 0 ? (
                    <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center">
                      <ImageLucide className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">Your gallery is empty. Add some photos to showcase your style!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {galleryImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-700"
                          />
                          <button
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-2 right-2 bg-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Seller Tier Display - Moved below the photo gallery */}
              {sellerTierInfo && (
                <div className="mt-8 bg-gradient-to-r from-[#1a1a1a] to-[#272727] rounded-xl border border-gray-800 p-6 shadow-xl">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="pr-6 flex-shrink-0">
                        <TierBadge tier={sellerTierInfo.tier} size="xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1 flex items-center">
                          <Award className="w-5 h-5 mr-2 text-[#ff950e]" />
                          Your Seller Tier: <span className="ml-2 text-[#ff950e]">{sellerTierInfo.tier}</span>
                        </h2>
                        <p className="text-gray-300">
                          {sellerTierInfo.credit > 0 ? (
                            <>You earn an additional <span className="font-bold text-green-400">{(sellerTierInfo.credit * 100).toFixed(0)}%</span> on all your sales!</>
                          ) : (
                            <>Make more sales to earn additional credits on your sales</>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {sellerTierInfo.tier !== 'Goddess' && (
                      <div className="bg-[#111] border border-gray-800 rounded-lg p-3 shadow-inner">
                        <div className="text-sm text-gray-400">Next tier: <span className="font-medium text-purple-400">{getNextTier(sellerTierInfo.tier)}</span></div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-green-300 text-sm">
                            Need: {TIER_LEVELS[getNextTier(sellerTierInfo.tier)].minSales} sales or ${TIER_LEVELS[getNextTier(sellerTierInfo.tier)].minAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Tier progression overview */}
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Tier Benefits Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                      <div className={`p-2 rounded ${sellerTierInfo.tier === 'Tease' ? 'bg-gray-800 ring-2 ring-[#ff950e]' : 'bg-gray-800/50'}`}>
                        <div className="font-medium mb-1">Tease</div>
                        <div className="text-gray-400">No credit</div>
                      </div>
                      <div className={`p-2 rounded ${sellerTierInfo.tier === 'Flirt' ? 'bg-gray-800 ring-2 ring-[#ff950e]' : 'bg-gray-800/50'}`}>
                        <div className="font-medium mb-1">Flirt</div>
                        <div className="text-gray-400">+1% credit</div>
                      </div>
                      <div className={`p-2 rounded ${sellerTierInfo.tier === 'Obsession' ? 'bg-gray-800 ring-2 ring-[#ff950e]' : 'bg-gray-800/50'}`}>
                        <div className="font-medium mb-1">Obsession</div>
                        <div className="text-gray-400">+2% credit</div>
                      </div>
                      <div className={`p-2 rounded ${sellerTierInfo.tier === 'Desire' ? 'bg-gray-800 ring-2 ring-[#ff950e]' : 'bg-gray-800/50'}`}>
                        <div className="font-medium mb-1">Desire</div>
                        <div className="text-gray-400">+3% credit</div>
                      </div>
                      <div className={`p-2 rounded ${sellerTierInfo.tier === 'Goddess' ? 'bg-gray-800 ring-2 ring-[#ff950e]' : 'bg-gray-800/50'}`}>
                        <div className="font-medium mb-1">Goddess</div>
                        <div className="text-gray-400">+5% credit</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
