// src/app/sellers/my-listings/page.tsx
'use client';

import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import { useMyListings } from '@/hooks/useMyListings';
import { Sparkles, Crown, Gavel, BarChart2 } from 'lucide-react';

// Import all components
import StatsCard from '@/components/myListings/StatsCard';
import ListingLimitMessage from '@/components/myListings/ListingLimitMessage';
import ListingForm from '@/components/myListings/ListingForm';
import ListingCard from '@/components/myListings/ListingCard';
import VerificationBanner from '@/components/myListings/VerificationBanner';
import TipsCard from '@/components/myListings/TipsCard';
import RecentSales from '@/components/myListings/RecentSales';

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

export default function MyListingsPage() {
  const {
    user,
    formState,
    showForm,
    selectedFiles,
    isUploading,
    editingState,
    isVerified,
    myListings,
    atLimit,
    auctionCount,
    premiumCount,
    standardCount,
    sellerOrders,
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
      <BanCheck>
        <RequireAuth role="seller">
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
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
                  <StatsCard
                    title="Standard Listings"
                    count={standardCount}
                    icon={Sparkles}
                    iconColor="text-gray-600"
                    borderColor="border-gray-800"
                  />
                  <StatsCard
                    title="Premium Listings"
                    count={premiumCount}
                    icon={Crown}
                    iconColor="text-[#ff950e]"
                    borderColor="border-[#ff950e]"
                  />
                  <StatsCard
                    title="Auction Listings"
                    count={auctionCount}
                    icon={Gavel}
                    iconColor="text-purple-500"
                    borderColor="border-purple-700"
                  />
                </div>

                {/* Listing Limit Message */}
                {atLimit && (
                  <ListingLimitMessage isVerified={isVerified} isEditing={editingState.isEditing} />
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
                  <ListingForm
                    formState={formState}
                    isEditing={editingState.isEditing}
                    isVerified={isVerified}
                    selectedFiles={selectedFiles}
                    isUploading={isUploading}
                    onFormChange={updateFormState}
                    onFileSelect={handleFileSelect}
                    onRemoveFile={removeSelectedFile}
                    onUploadFiles={handleUploadFiles}
                    onRemoveImage={handleRemoveImageUrl}
                    onImageReorder={handleImageReorder}
                    onSave={handleSaveListing}
                    onCancel={resetForm}
                  />
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
                          key={`listing-${listing.id}`}
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
                  <VerificationBanner onVerifyClick={() => {}} />
                )}

                {/* Auction Seller Tips */}
                <TipsCard
                  title="Auction Tips"
                  icon={Gavel}
                  iconColor="text-purple-500"
                  borderColor="border-purple-700"
                  tips={AUCTION_TIPS}
                  isVerified={isVerified}
                  showVerifyLink={true}
                />
                
                {/* Premium Seller Tips */}
                <TipsCard
                  title="Premium Seller Tips"
                  icon={Crown}
                  iconColor="text-[#ff950e]"
                  borderColor="border-[#ff950e]"
                  tips={PREMIUM_TIPS}
                />

                {/* Recent Sales */}
                <RecentSales orders={sellerOrders} />
              </div>
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}