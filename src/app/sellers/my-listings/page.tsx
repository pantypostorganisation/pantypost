// src/app/sellers/my-listings/page.tsx
'use client';

import { Crown, Sparkles, Gavel, BarChart2, LockIcon, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import StatsCard from '@/components/myListings/StatsCard';
import ListingCard from '@/components/myListings/ListingCard';
import ListingForm from '@/components/myListings/ListingForm';
import ListingLimitMessage from '@/components/myListings/ListingLimitMessage';
import TipsCard from '@/components/myListings/TipsCard';
import RecentSales from '@/components/myListings/RecentSales';
import VerificationBanner from '@/components/myListings/VerificationBanner';
import { useMyListings } from '@/hooks/useMyListings';
import { useRouter } from 'next/navigation';

const AUCTION_TIPS = [
  'Set a competitive starting price to attract initial bids.',
  'Use a reserve price to ensure you don\'t sell below your minimum acceptable price.',
  'Add high-quality photos and detailed descriptions to encourage higher bids.',
  'Auctions create excitement and can result in higher final prices than fixed listings.'
];

const PREMIUM_TIPS = [
  'Premium listings are only visible to your subscribers, increasing exclusivity.',
  'Set your monthly subscription price in your profile settings to unlock premium features.',
  'Use high-quality, appealing images for your listings to attract more views and buyers.',
  'Premium listings can often command higher prices due to their exclusive nature.'
];

// Separate the main content into its own component
function MyListingsContent() {
  const router = useRouter();
  const {
    // State
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
    sellerOrders,
    
    // Actions
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
          {/* Left side: form + active listings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300">Standard Listings</h3>
                    <span className="text-4xl font-bold text-white">{standardCount}</span>
                  </div>
                  <Sparkles className="w-10 h-10 text-gray-600" />
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#ff950e]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300">Premium Listings</h3>
                    <span className="text-4xl font-bold text-[#ff950e]">{premiumCount}</span>
                  </div>
                  <Crown className="w-10 h-10 text-[#ff950e]" />
                </div>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-purple-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300">Auction Listings</h3>
                    <span className="text-4xl font-bold text-purple-500">{auctionCount}</span>
                  </div>
                  <Gavel className="w-10 h-10 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Listing Limit Message */}
            {atLimit && !editingState.isEditing && (
              <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 rounded-lg p-4 my-4 text-center font-semibold">
                {isVerified ? (
                  <>
                    You have reached the maximum of <span className="text-[#ff950e] font-bold">25</span> listings for verified sellers.
                  </>
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

            {/* Create Listing Button or Form */}
            {!showForm && !editingState.isEditing && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition flex items-center gap-2"
                  disabled={atLimit}
                  style={atLimit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <Sparkles className="w-5 h-5" />
                  Create New Listing
                </button>
              </div>
            )}

            {(showForm || editingState.isEditing) && (
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
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
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                Your Active Listings
                <BarChart2 className="w-6 h-6 text-[#ff950e]" />
              </h2>
              {myListings.length === 0 ? (
                <div className="text-center py-10 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400">
                  <p className="text-lg mb-2">You haven't created any listings yet.</p>
                  <p className="text-sm">Use the button above to add your first listing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myListings.map((listing) => (
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

          {/* Right side: verification banner, tips, and order history */}
          <div className="space-y-8">
            {/* Verification Banner */}
            {!isVerified && (
              <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-yellow-700">
                <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                  <ShieldCheck className="text-yellow-500 w-6 h-6" />
                  Get Verified
                </h2>
                <div className="mb-5">
                  <p className="text-gray-300 mb-3">
                    Verified sellers get these exclusive benefits:
                  </p>
                  <ul className="space-y-2 text-gray-300 text-sm">
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
                <Link
                  href="/sellers/verify"
                  className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-500 font-bold text-lg transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Verify My Account
                </Link>
              </div>
            )}

            {/* Auction Seller Tips */}
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-purple-700">
              <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                <Gavel className="text-purple-500 w-6 h-6" />
                Auction Tips
              </h2>
              <ul className="space-y-4 text-gray-300 text-sm">
                {AUCTION_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {!isVerified && (
                <div className="mt-5 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <LockIcon className="text-yellow-500 w-5 h-5" />
                    <p className="text-yellow-400 text-sm">
                      <Link href="/sellers/verify" className="underline hover:text-yellow-300">Get verified</Link> to unlock auction listings!
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Premium Seller Tips */}
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-[#ff950e]">
              <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
                <Crown className="text-[#ff950e] w-6 h-6" />
                Premium Seller Tips
              </h2>
              <ul className="space-y-4 text-gray-300 text-sm">
                {PREMIUM_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-[#ff950e] font-bold text-lg leading-none">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Sales */}
            <RecentSales orders={sellerOrders} />
          </div>
        </div>
      </div>
    </main>
  );
}

// Main page component with proper provider wrapping
export default function MyListingsPage() {
  return (
    <BanCheck>
      <RequireAuth role="seller">
        <MyListingsContent />
      </RequireAuth>
    </BanCheck>
  );
}
