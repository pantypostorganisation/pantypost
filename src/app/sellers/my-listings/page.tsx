// src/app/sellers/my-listings/page.tsx
'use client';

import { Shirt, Crown, Tag, TrendingUp, Gavel, Plus } from 'lucide-react';
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

export default function MyListingsPage() {
  const router = useRouter();
  const {
    // State
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

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-black text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-[#ff950e]">My Listings</h1>
              <p className="text-gray-400">Manage and create your listings</p>
            </div>

            {/* Verification Banner */}
            {!isVerified && (
              <VerificationBanner onVerifyClick={() => router.push('/sellers/verify')} />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatsCard
                title="Total Listings"
                count={myListings.length}
                icon={Shirt}
                iconColor="text-[#ff950e]"
                borderColor="border-[#ff950e]"
              />
              <StatsCard
                title="Active Auctions"
                count={auctionCount}
                icon={Gavel}
                iconColor="text-purple-500"
                borderColor="border-purple-500"
              />
              <StatsCard
                title="Premium Listings"
                count={premiumCount}
                icon={Crown}
                iconColor="text-yellow-500"
                borderColor="border-yellow-500"
              />
              <StatsCard
                title="Standard Listings"
                count={standardCount}
                icon={Tag}
                iconColor="text-green-500"
                borderColor="border-green-500"
              />
            </div>

            {/* Create New Listing Button */}
            {!showForm && (
              <div className="mb-8">
                {atLimit ? (
                  <ListingLimitMessage
                    currentListings={myListings.length}
                    maxListings={maxListings}
                    isVerified={isVerified}
                  />
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-[#ff950e] hover:bg-[#e0850d] text-black px-6 py-3 rounded-lg font-medium transition"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Listing
                  </button>
                )}
              </div>
            )}

            {/* Listing Form */}
            {showForm && (
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
            )}

            {/* Listings Grid */}
            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            ) : (
              !showForm && (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                  <Shirt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">You haven't created any listings yet</p>
                  {!atLimit && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-[#ff950e] hover:bg-[#e0850d] text-black px-6 py-2 rounded-lg font-medium transition"
                    >
                      Create Your First Listing
                    </button>
                  )}
                </div>
              )
            )}

            {/* Tips and Recent Sales Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tips Card */}
              <TipsCard
                title="Listing Tips"
                icon={TrendingUp}
                iconColor="text-green-500"
                borderColor="border-green-500"
                tips={[
                  "Use high-quality, well-lit photos from multiple angles",
                  "Write detailed descriptions including material, size, and condition",
                  "Price competitively by researching similar items",
                  "Add relevant tags to improve discoverability",
                  "Consider premium listings for exclusive content",
                  isVerified ? "Create auctions to drive competitive pricing" : "Get verified to unlock auction listings"
                ]}
                isVerified={isVerified}
                showVerifyLink={!isVerified}
              />

              {/* Recent Sales */}
              {sellerOrders.length > 0 && (
                <RecentSales orders={sellerOrders.slice(0, 5)} />
              )}
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
