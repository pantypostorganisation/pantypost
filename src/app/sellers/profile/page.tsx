// src/app/sellers/profile/page.tsx
'use client';

import { useRef } from 'react';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ProfileInfoCard from '@/components/seller-settings/ProfileInfoCard';
import TierProgressCard from '@/components/seller-settings/TierProgressCard';
import GalleryManager from '@/components/seller-settings/GalleryManager';
import TierDetailsModal from '@/components/seller-settings/modals/TierDetailsModal';
import SaveButton from '@/components/seller-settings/utils/SaveButton';
import TierDisplaySection from '@/components/seller-settings/TierDisplaySection';
import { useProfileSettings } from '@/hooks/seller-settings/useProfileSettings';

export default function SellerProfileSettingsPage() {
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  const {
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
    
    // Save functionality - Now includes all states
    saveSuccess,
    saveError,
    isSaving,
    handleSave
  } = useProfileSettings();

  const tierProgress = getTierProgress();
  const nextTier = sellerTierInfo ? getNextTier(sellerTierInfo.tier) : 'Tease';

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-black text-white py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-[#ff950e]">My Profile</h1>
            <p className="text-gray-400 mb-8">Manage your seller profile and photo gallery</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Profile info and tier progress */}
              <div className="lg:col-span-1 space-y-6">
                <ProfileInfoCard
                  username={user?.username}
                  bio={bio}
                  setBio={setBio}
                  preview={preview}
                  profilePic={profilePic}
                  subscriptionPrice={subscriptionPrice}
                  setSubscriptionPrice={setSubscriptionPrice}
                  handleProfilePicChange={handleProfilePicChange}
                  removeProfilePic={removeProfilePic}
                  profilePicInputRef={profilePicInputRef}
                  isUploading={profileUploading}
                />

                {/* Save Button with loading and error states */}
                <div className="flex justify-center">
                  <SaveButton 
                    onClick={handleSave} 
                    showSuccess={saveSuccess}
                    showError={saveError}
                    isLoading={isSaving}
                  />
                </div>

                {sellerTierInfo && (
                  <TierProgressCard
                    sellerTierInfo={sellerTierInfo}
                    userStats={userStats}
                    tierProgress={tierProgress}
                    nextTier={nextTier}
                    onTierClick={setSelectedTierDetails}
                  />
                )}
              </div>

              {/* Right column - Gallery */}
              <div className="lg:col-span-2">
                <GalleryManager
                  galleryImages={galleryImages}
                  selectedFiles={selectedFiles}
                  isUploading={galleryUploading}
                  uploadProgress={uploadProgress}
                  multipleFileInputRef={multipleFileInputRef}
                  handleMultipleFileChange={handleMultipleFileChange}
                  uploadGalleryImages={uploadGalleryImages}
                  removeGalleryImage={removeGalleryImage}
                  removeSelectedFile={removeSelectedFile}
                  clearAllGalleryImages={clearAllGalleryImages}
                />
              </div>
            </div>

            {/* Tier Display Section */}
            {sellerTierInfo && (
              <TierDisplaySection
                sellerTierInfo={sellerTierInfo}
                userStats={userStats}
                nextTier={nextTier}
                selectedTierDetails={selectedTierDetails}
                onTierSelect={setSelectedTierDetails}
              />
            )}
          </div>

          {/* Tier Details Modal */}
          {selectedTierDetails && (
            <TierDetailsModal
              selectedTier={selectedTierDetails}
              onClose={() => setSelectedTierDetails(null)}
            />
          )}
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
