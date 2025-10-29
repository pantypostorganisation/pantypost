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
    
    // Save functionality
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
        <main className="min-h-screen bg-gradient-to-b from-black via-[#0f0a06] to-black text-white py-12 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
              {/* Left column - Profile info and tier progress */}
              <div className="xl:col-span-1 space-y-8">
                <div className="rounded-3xl border border-white/5 bg-black/40 p-1 backdrop-blur">
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
                </div>

                {/* Save Button with loading and error states */}
                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a120f] to-black p-6 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-4 text-sm text-gray-300">
                    <p className="text-base font-medium text-white">Ready to publish your latest changes?</p>
                    <p className="text-xs text-gray-400">
                      Click save to sync profile updates with buyers instantly. Your gallery uploads are stored securely.
                    </p>
                    <SaveButton
                      onClick={handleSave}
                      showSuccess={saveSuccess}
                      showError={saveError} // Now correctly passing string | undefined
                      isLoading={isSaving}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Gallery */}
              <div className="xl:col-span-2 space-y-8">
                <div className="rounded-3xl border border-white/5 bg-black/40 p-1 backdrop-blur">
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

                <div className="rounded-3xl border border-dashed border-[#ff950e]/40 bg-[#ff950e]/5 p-6 text-sm text-[#ffb347]">
                  <p className="font-medium text-[#ffcb80]">Pro tip</p>
                  <p className="mt-2 text-xs text-[#ffd9a3] leading-relaxed">
                    Highlight a mix of lifestyle, detail, and teaser shots to give buyers a richer preview of what&apos;s available
                    through subscriptions and custom requests.
                  </p>
                </div>
              </div>
            </div>

            {/* Tier Progress & Display Section */}
            {sellerTierInfo && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="rounded-3xl border border-white/5 bg-black/40 p-1 backdrop-blur">
                  <TierProgressCard
                    sellerTierInfo={sellerTierInfo}
                    userStats={userStats}
                    tierProgress={tierProgress}
                    nextTier={nextTier}
                    onTierClick={setSelectedTierDetails}
                  />
                </div>

                <TierDisplaySection
                  sellerTierInfo={sellerTierInfo}
                  userStats={userStats}
                  nextTier={nextTier}
                  selectedTierDetails={selectedTierDetails}
                  onTierSelect={setSelectedTierDetails}
                />
              </div>
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
