// src/app/sellers/my-listings/page.tsx
'use client';

import { Crown, Sparkles, Gavel, BarChart2, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ListingCard from '@/components/myListings/ListingCard';
import ListingForm from '@/components/myListings/ListingForm';
import { useMyListings } from '@/hooks/useMyListings';

const AUCTION_TIPS = [
  'Set a competitive starting price to attract initial bids.',
  "Use a reserve price to ensure you don't sell below your minimum acceptable price.",
  'Add high-quality photos and detailed descriptions to encourage higher bids.',
  'Auctions create excitement and can result in higher final prices than fixed listings.',
];

const PREMIUM_TIPS = [
  'Premium listings are only visible to your subscribers, increasing exclusivity.',
  'Set your monthly subscription price in your profile settings to unlock premium features.',
  'Use high-quality, appealing images for your listings to attract more views and buyers.',
  'Premium listings can often command higher prices due to their exclusive nature.',
];

function MyListingsContent() {
  const {
    user,
    showForm,
    formState,
    selectedFiles,
    isUploading,
    uploadProgress,
    editingState,
    isVerified,
    myListings,
    atLimit,
    maxListings,
    auctionCount,
    premiumCount,
    standardCount,

    setShowForm,
    updateFormState,
    resetForm,
    handleFileSelect,
    removeSelectedFile,
    handleUploadFiles,
    handleRemoveImageUrl,
    handleImageReorder,
    handleSaveListing,
    handleEditClick,
    handleCancelAuction,
    removeListing,
    getListingAnalytics,
  } = useMyListings();

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Listings</h1>
          <div className="w-16 h-1 bg-[#ff950e] mt-2 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left: form + active listings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white/80">Standard Listings</h3>
                    <span className="text-4xl font-bold text-white">{standardCount ?? 0}</span>
                  </div>
                  <Sparkles className="w-10 h-10 text-white/30" />
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-[#ff950e]/60">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white/80">Premium Listings</h3>
                    <span className="text-4xl font-bold text-[#ff950e]">{premiumCount ?? 0}</span>
                  </div>
                  <Crown className="w-10 h-10 text-[#ff950e]" />
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow-lg border border-purple-700/70">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white/80">Auction Listings</h3>
                    <span className="text-4xl font-bold text-purple-400">{auctionCount ?? 0}</span>
                  </div>
                  <Gavel className="w-10 h-10 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Limit notice */}
            {atLimit && !editingState.isEditing && (
              <div className="bg-yellow-950/60 border border-yellow-700/70 text-yellow-100 rounded-xl p-4 my-4 text-center font-semibold">
                {isVerified ? (
                  <>You have reached the maximum of <span className="text-[#ff950e] font-bold">25</span> listings for verified sellers.</>
                ) : (
                  <>
                    Unverified sellers can only have <span className="text-[#ff950e] font-bold">2</span> active listings.<br />
                    <span className="block mt-2">
                      <Link
                        href="/sellers/verify"
                        className="text-[#ff950e] font-bold underline hover:text-white transition"
                      >
                        Verify your account
                      </Link>{' '}
                      to add up to 25 listings!
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Create Listing CTA (refreshed style) */}
            {!showForm && !editingState.isEditing && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="
                    px-8 py-3 rounded-2xl font-semibold text-lg
                    bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff6a00]
                    text-black shadow-lg transition-all duration-300
                    hover:scale-105 hover:shadow-[#ff950e]/50
                    focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black
                    flex items-center gap-2
                  "
                  disabled={atLimit}
                  style={atLimit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  aria-label="Create New Listing"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-black">Create New Listing</span>
                </button>
              </div>
            )}

            {(showForm || editingState.isEditing) && (
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-lg border border-white/10">
                <ListingForm
                  formState={formState}
                  isEditing={editingState.isEditing}
                  isVerified={isVerified}
                  selectedFiles={selectedFiles}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  onFormChange={updateFormState}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={removeSelectedFile}
                  onUploadFiles={handleUploadFiles}
                  onRemoveImage={handleRemoveImageUrl}
                  onImageReorder={handleImageReorder}
                  onSave={handleSaveListing}
                  onCancel={resetForm}
                />
              </div>
            )}

            {/* Active Listings */}
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-lg border border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                Your Active Listings
                <BarChart2 className="w-6 h-6 text-[#ff950e]" />
              </h2>
              {(myListings?.length ?? 0) === 0 ? (
                <div className="text-center py-10 bg-black rounded-xl border border-dashed border-white/10 text-white/60">
                  <p className="text-lg mb-2">You haven't created any listings yet.</p>
                  <p className="text-sm">Use the button above to add your first listing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myListings!.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      analytics={getListingAnalytics(listing)}
                      onEdit={handleEditClick}
                      onDelete={removeListing}
                      onCancelAuction={handleCancelAuction}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: verification banner + tips */}
          <div className="space-y-8">
            {/* Verification Banner */}
            {!isVerified && (
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-lg border border-yellow-700/70">
                <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                  <ShieldCheck className="text-yellow-500 w-6 h-6" />
                  Get Verified
                </h2>
                <div className="mb-5">
                  <p className="text-white/80 mb-3">Verified sellers get these exclusive benefits:</p>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
                      <span>Post up to <span className="text-yellow-500 font-bold">25 listings</span> (vs only 2 for unverified)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
                      <span>Create <span className="text-purple-400 font-bold">auction listings</span> for higher bids</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
                      <div className="flex items-center">
                        <span>Display a verification badge </span>
                        <img src="/verification_badge.png" alt="Verification Badge" className="w-4 h-4 mx-1" />
                        <span> on your profile and listings</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
                      <span>Earn buyers' trust for more sales and higher prices</span>
                    </li>
                  </ul>
                </div>

                {/* Verify CTA with guaranteed black text */}
                <Link
                  href="/sellers/verify"
                  aria-label="Verify My Account"
                  className="
                    group w-full px-6 py-3 rounded-2xl font-bold text-lg
                    flex items-center justify-center gap-2
                    bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff6a00]
                    text-black shadow-xl transition-all duration-300
                    hover:scale-105 hover:shadow-[#ff950e]/60
                    focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black
                  "
                >
                  <ShieldCheck className="w-5 h-5 text-black transition-transform duration-300 group-hover:rotate-12" />
                  <span className="tracking-wide text-black">Verify My Account</span>
                </Link>
              </div>
            )}

            {/* Auction Tips */}
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-700/70">
              <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                <Gavel className="text-purple-400 w-6 h-6" />
                Auction Tips
              </h2>
              <ul className="space-y-4 text-white/80 text-sm">
                {AUCTION_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold text-lg leading-none">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {!isVerified && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Lock className="text-yellow-500 w-5 h-5" />
                    <p className="text-yellow-300 text-sm">
                      <Link href="/sellers/verify" className="underline hover:text-yellow-200">
                        Get verified
                      </Link>{' '}
                      to unlock auction listings!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Tips */}
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl shadow-lg border border-[#ff950e]/60">
              <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                <Crown className="text-[#ff950e] w-6 h-6" />
                Premium Seller Tips
              </h2>
              <ul className="space-y-4 text-white/80 text-sm">
                {PREMIUM_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Sales removed */}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function MyListingsPage() {
  return (
    <BanCheck>
      <RequireAuth role="seller">
        <MyListingsContent />
      </RequireAuth>
    </BanCheck>
  );
}
