// src/app/sellers/profile/page.tsx
'use client';

import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ProfileInfoCard from '@/components/seller-settings/ProfileInfoCard';
import CoverPhotoCard from '@/components/seller-settings/CoverPhotoCard';
import TierProgressCard from '@/components/seller-settings/TierProgressCard';
import GalleryManager from '@/components/seller-settings/GalleryManager';
import PendingGalleryStrip from '@/components/seller-settings/PendingGalleryStrip';
import LocationPrivacyCard from '@/components/seller-settings/LocationPrivacyCard';
import ReferralSection from '@/components/seller-settings/ReferralSection';
import TierDetailsModal from '@/components/seller-settings/modals/TierDetailsModal';
import SaveButton from '@/components/seller-settings/utils/SaveButton';
import TierDisplaySection from '@/components/seller-settings/TierDisplaySection';
import { useProfileSettings } from '@/hooks/seller-settings/useProfileSettings';

export default function SellerProfileSettingsPage() {
  const {
    user,

    // Profile data
    bio,
    setBio,
    profilePic,
    preview,
    subscriptionPrice,
    setSubscriptionPrice,
    country,
    setCountry,
    isLocationPublic,
    setIsLocationPublic,
    profileUploading,
    profilePicPendingReview,
    handleProfilePicChange,
    removeProfilePic,
    profilePicInputRef,

    // Cover photo
    coverPhoto,
    coverPending,
    coverUploading,
    coverError,
    coverInputRef,
    handleCoverPhotoChange,
    removeCoverPhoto,

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
    pendingGalleryImages,
    withdrawPendingGalleryImage,

    // Tier info
    sellerTierInfo,
    userStats,
    getTierProgress,
    getNextTier,
    selectedTierDetails,
    setSelectedTierDetails,

    // Save
    saveSuccess,
    saveError,
    isSaving,
    handleSave,
    locationError,
  } = useProfileSettings();

  const tierProgress = getTierProgress();
  const nextTier = sellerTierInfo ? getNextTier(sellerTierInfo.tier) : 'Tease';

  return (
    <BanCheck>
      <RequireAuth role="seller">
        {/* Flat surface. The page previously carried a three-stop
            gradient, which is decoration on a settings screen. */}
        <main className="min-h-screen bg-surface pb-28 text-ink">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-ink">Shop settings</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Images are reviewed before buyers can see them. Everything else applies as soon
                as you save.
              </p>
            </header>

            {/* Cover spans the full width because it renders full-bleed
                on the shop page — previewing it in a narrow column would
                misrepresent the crop. */}
            <CoverPhotoCard
              coverPhoto={coverPhoto}
              isPending={coverPending}
              isUploading={coverUploading}
              error={coverError}
              inputRef={coverInputRef}
              onChange={handleCoverPhotoChange}
              onRemove={removeCoverPhoto}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-1">
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

                {profilePicPendingReview && (
                  <p className="rounded-md border border-line bg-surface-raised px-4 py-3 text-xs text-ink-muted">
                    Your new profile picture is awaiting review. You can see it here; buyers
                    still see your approved one until it is cleared.
                  </p>
                )}
              </div>

              <div className="space-y-6 lg:col-span-2">
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

                <PendingGalleryStrip
                  images={pendingGalleryImages}
                  onWithdraw={withdrawPendingGalleryImage}
                />

                <LocationPrivacyCard
                  country={country}
                  onCountryChange={setCountry}
                  isLocationPublic={isLocationPublic}
                  onLocationVisibilityChange={setIsLocationPublic}
                  error={locationError}
                />
              </div>
            </div>

            <ReferralSection />

            {sellerTierInfo && (
              <div className="space-y-6">
                <TierProgressCard
                  sellerTierInfo={sellerTierInfo}
                  userStats={userStats}
                  tierProgress={tierProgress}
                  nextTier={nextTier}
                  onTierClick={setSelectedTierDetails}
                />
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

          {/* Sticky save bar.
              Save used to sit in a card in the left column, above the
              gallery and tier sections, so on a long page it scrolled
              out of reach and it was unclear what it covered. Pinned to
              the bottom it is always reachable and always means the same
              thing. */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <p className="hidden text-xs text-ink-faint sm:block">
                Bio, subscription price and location. Images save when you upload them.
              </p>
              <SaveButton
                onClick={handleSave}
                showSuccess={saveSuccess}
                showError={saveError}
                isLoading={isSaving}
              />
            </div>
          </div>

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
