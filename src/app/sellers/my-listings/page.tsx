'use client';

import {
  Crown,
  Sparkles,
  Gavel,
  BarChart2,
  Lock,
  ShieldCheck,
  LayoutDashboard,
  ArrowUpRight,
  PlusCircle,
  Timer,
} from 'lucide-react';
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

  const totalListings = myListings?.length ?? 0;
  const remainingSlots = Math.max((maxListings ?? 0) - totalListings, 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0916] to-black text-white py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#ff950e]/10 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-32 h-64 w-64 rounded-full bg-[#ff6a00]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mb-12 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-10 shadow-[0_20px_60px_-25px_rgba(255,149,14,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                <LayoutDashboard className="h-4 w-4 text-[#ff950e]" />
                Seller Workspace
              </span>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white">
                  My Listings
                </h1>
                <p className="mt-4 text-base sm:text-lg text-white/70">
                  Manage every listing, check performance, and launch new drops in a single, streamlined hub.
                  Stay on-brand, stay premium, and keep your shop looking irresistible.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-white/60">Active Listings</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-white">{totalListings}</span>
                    <ArrowUpRight className="h-4 w-4 text-[#ff950e]" />
                  </div>
                </div>
                <div className="rounded-2xl border border-[#ff950e]/30 bg-gradient-to-br from-[#ff950e]/15 via-[#ff6a00]/10 to-transparent p-4">
                  <p className="text-xs uppercase tracking-wider text-white/70">Available Slots</p>
                  <div className="mt-2 text-3xl font-semibold text-[#ffb347]">{remainingSlots}</div>
                </div>
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-700/10 to-transparent p-4">
                  <p className="text-xs uppercase tracking-wider text-white/70">Auctions Running</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-purple-200">{auctionCount ?? 0}</span>
                    <Timer className="h-4 w-4 text-purple-200" />
                  </div>
                </div>
              </div>
            </div>

            {!showForm && !editingState.isEditing && (
              <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-black/50 p-6 text-center shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]">
                <p className="text-sm text-white/60">Launch something new</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff6a00] px-5 py-3 text-base font-semibold text-black shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  disabled={atLimit}
                  style={atLimit ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                  aria-label="Create New Listing"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Create Listing</span>
                </button>
                <p className="mt-4 text-xs text-white/50">
                  {isVerified ? 'Boost your presence with premium-only drops and auctions.' : 'Verify your seller account to unlock auctions and premium-only drops.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Left: form + active listings */}
          <div className="space-y-8 lg:col-span-2">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-35px_rgba(255,255,255,0.45)] transition hover:border-white/20 hover:bg-white/10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/60">Standard</p>
                    <p className="mt-4 text-4xl font-bold text-white">{standardCount ?? 0}</p>
                  </div>
                  <div className="rounded-full bg-white/5 p-3 text-white/60 transition group-hover:bg-[#ff950e]/20 group-hover:text-[#ff950e]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-5 text-xs text-white/50">Keep your storefront fresh with rotating standard listings.</p>
              </div>
              <div className="group overflow-hidden rounded-2xl border border-[#ff950e]/40 bg-gradient-to-br from-[#ff950e]/15 via-[#ff6a00]/10 to-transparent p-6 shadow-[0_20px_60px_-25px_rgba(255,149,14,0.45)] transition hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Premium</p>
                    <p className="mt-4 text-4xl font-bold text-[#ffb347]">{premiumCount ?? 0}</p>
                  </div>
                  <div className="rounded-full bg-[#ff950e]/20 p-3 text-[#ff950e]">
                    <Crown className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-5 text-xs text-white/60">Reward your subscribers with exclusive premium-only releases.</p>
              </div>
              <div className="group overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-500/20 via-purple-700/15 to-transparent p-6 shadow-[0_20px_60px_-25px_rgba(124,58,237,0.45)] transition hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Auctions</p>
                    <p className="mt-4 text-4xl font-bold text-purple-200">{auctionCount ?? 0}</p>
                  </div>
                  <div className="rounded-full bg-purple-500/20 p-3 text-purple-200">
                    <Gavel className="h-6 w-6" />
                  </div>
                </div>
                <p className="mt-5 text-xs text-white/60">Drive urgency and higher bids with time-limited auction drops.</p>
              </div>
            </div>

            {/* Limit notice */}
            {atLimit && !editingState.isEditing && (
              <div className="my-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent p-5 text-center font-semibold text-yellow-100 shadow-[0_20px_60px_-35px_rgba(250,204,21,0.45)]">
                {isVerified ? (
                  <>You have reached the maximum of <span className="text-[#ff950e] font-bold">25</span> listings for verified sellers.</>
                ) : (
                  <>
                    Unverified sellers can only have <span className="text-[#ff950e] font-bold">2</span> active listings.
                    <span className="mt-2 block text-sm font-normal text-yellow-100/80">
                      <Link
                        href="/sellers/verify"
                        className="font-semibold text-[#ffb347] underline decoration-dotted underline-offset-4 transition hover:text-white"
                      >
                        Verify your account
                      </Link>{' '}
                      to add up to 25 listings!
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Create Listing CTA */}
            {(showForm || editingState.isEditing) && (
              <div className="rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
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
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-8 shadow-[0_25px_60px_-35px_rgba(255,149,14,0.4)] backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Active Listings</h2>
                  <p className="text-sm text-white/60">Track performance, edit details, or sunset listings in seconds.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                  <BarChart2 className="h-4 w-4 text-[#ff950e]" />
                  {totalListings} live
                </div>
              </div>
              <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              {(myListings?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 py-10 text-center text-white/60">
                  <p className="text-lg font-medium text-white/70">You haven't created any listings yet.</p>
                  <p className="mt-2 text-sm text-white/50">Tap “Create Listing” to drop your first item.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            {!isVerified && (
              <div className="overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/15 via-yellow-500/10 to-transparent p-6 sm:p-8 shadow-[0_25px_60px_-35px_rgba(250,204,21,0.45)] backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-yellow-500/20 p-3">
                    <ShieldCheck className="h-6 w-6 text-yellow-200" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Get Verified</h2>
                    <p className="mt-2 text-sm text-yellow-50/80">
                      Unlock higher limits, auctions, and a premium trust badge that reassures buyers instantly.
                    </p>
                    <ul className="mt-5 space-y-3 text-sm text-yellow-50/80">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-yellow-300" />
                        <span>
                          Post up to <span className="font-semibold text-yellow-200">25 listings</span> instead of 2
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-yellow-300" />
                        <span>
                          Launch <span className="font-semibold text-purple-100">auction listings</span> for bidding wars
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-yellow-300" />
                        <span className="flex items-center gap-1">
                          Display the verification badge
                          <img src="/verification_badge.png" alt="Verification Badge" className="h-4 w-4" />
                          everywhere
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-yellow-300" />
                        <span>Build trust that converts browsers into buyers.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <Link
                  href="/sellers/verify"
                  aria-label="Verify My Account"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_-20px_rgba(0,0,0,0.7)] transition hover:-translate-y-[2px] hover:shadow-yellow-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Verify my account
                </Link>
              </div>
            )}

            {/* Auction Tips */}
            <div className="overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-600/20 via-purple-700/10 to-transparent p-6 sm:p-8 shadow-[0_25px_60px_-35px_rgba(139,92,246,0.5)] backdrop-blur">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                <Gavel className="h-6 w-6 text-purple-200" />
                Auction Tips
              </h2>
              <p className="mt-2 text-sm text-purple-50/70">Create scarcity, fuel excitement, and keep bidders coming back.</p>
              <ul className="mt-6 space-y-4 text-sm text-purple-50/80">
                {AUCTION_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-purple-200/50 text-xs font-semibold text-purple-100">
                      {index + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {!isVerified && (
                <div className="mt-6 rounded-2xl border border-purple-200/20 bg-black/40 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 flex-shrink-0 text-yellow-300" />
                    <p className="text-xs text-purple-50/70">
                      <Link href="/sellers/verify" className="font-semibold text-yellow-200 underline decoration-dotted underline-offset-4 hover:text-yellow-100">
                        Get verified
                      </Link>{' '}
                      to unlock auction listings!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Tips */}
            <div className="overflow-hidden rounded-3xl border border-[#ff950e]/40 bg-gradient-to-br from-[#ff950e]/20 via-[#ff6a00]/10 to-transparent p-6 sm:p-8 shadow-[0_25px_60px_-35px_rgba(255,149,14,0.5)] backdrop-blur">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                <Crown className="h-6 w-6 text-[#ffb347]" />
                Premium Seller Tips
              </h2>
              <p className="mt-2 text-sm text-white/70">Elevate your premium catalog with subscriber-only experiences.</p>
              <ul className="mt-6 space-y-4 text-sm text-white/80">
                {PREMIUM_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-[6px] inline-flex h-2.5 w-8 flex-shrink-0 rounded-full bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff6a00]" />
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
