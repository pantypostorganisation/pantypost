// src/app/sellers/profile/page.tsx
'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { Camera, MessageSquare, Package, Sparkles, Trophy, Wallet } from 'lucide-react';
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

  const stats = useMemo(
    () => [
      {
        label: 'Total sales',
        value: new Intl.NumberFormat().format(userStats?.totalSales ?? 0),
        description: 'Lifetime orders completed through your shop.',
        icon: Package
      },
      {
        label: 'Revenue earned',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          Number(userStats?.totalRevenue ?? 0)
        ),
        description: 'Gross revenue before fees and payouts.',
        icon: Wallet
      },
      {
        label: 'Next seller tier',
        value: nextTier,
        description: 'Unlock new perks as you grow your audience.',
        icon: Trophy
      }
    ],
    [nextTier, userStats?.totalRevenue, userStats?.totalSales]
  );

  const quickActions = useMemo(
    () => [
      {
        href: '/sellers/my-listings',
        label: 'Manage listings',
        icon: Sparkles
      },
      {
        href: '/sellers/messages',
        label: 'Open inbox',
        icon: MessageSquare
      },
      {
        href: '/sellers/verify',
        label: 'Get verified',
        icon: Camera
      }
    ],
    []
  );

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-gradient-to-b from-black via-[#0f0a06] to-black text-white py-12 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f120f] via-black to-[#0b0b0b] p-8 shadow-[0_25px_80px_-40px_rgba(255,149,14,0.35)]">
              <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_top,white,transparent_70%)] bg-[radial-gradient(circle_at_top,_#ff950e33,_transparent_60%)]" />
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-1 text-sm font-medium text-[#ff950e] w-fit">
                    <Sparkles className="h-4 w-4" />
                    Seller hub
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-semibold text-white">Craft a profile buyers can&apos;t ignore</h1>
                  <p className="text-base text-gray-300 max-w-xl">
                    Keep your storefront looking sharp, update your subscription pricing, and curate a gallery that
                    showcases your personal brand. Every edit helps you convert more curious buyers into loyal fans.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#ff950e]/60 hover:bg-[#ff950e]/10"
                      >
                        <action.icon className="h-4 w-4 text-[#ff950e] transition group-hover:scale-110" />
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                  {stats.map(({ label, value, description, icon: Icon }) => (
                    <div
                      key={label}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                    >
                      <div className="absolute -top-10 right-0 h-24 w-24 rounded-full bg-[#ff950e]/10 blur-3xl" />
                      <div className="relative flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Icon className="h-4 w-4 text-[#ff950e]" />
                          {label}
                        </div>
                        <p className="text-2xl font-semibold text-white">{value}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

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
                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a120f] to-black p-6 text-center shadow-[0_15px_50px_-35px_rgba(255,149,14,0.35)]">
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
