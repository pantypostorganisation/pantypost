'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import Link from 'next/link';
import {
  Clock, User, ArrowRight, BadgeCheck, AlertTriangle, Crown, MessageCircle,
  DollarSign, ShoppingBag, Lock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ListingDetailPage() {
  const { listings, user, removeListing, addSellerNotification, isSubscribed, users } = useListings();
  const { id } = useParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const listing = listings.find((item) => item.id === listingId);
  const { purchaseListing } = useWallet();
  const { sendMessage, getMessagesForSeller, markMessagesAsRead } = useMessages();
  const { addRequest } = useRequests();
  const router = useRouter();

  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<{ bio?: string | null; pic?: string | null; subscriptionPrice?: string | null; }>({});
  const [showStickyBuy, setShowStickyBuy] = useState(false);

  const currentUsername = user?.username || '';
  const hasMarkedRef = useRef(false);
  const isSubscribedToSeller = user?.username && listing?.seller ? isSubscribed(user.username, listing.seller) : false;
  const needsSubscription = listing?.isPremium && !isSubscribedToSeller;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sticky Buy Now logic
  const imageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      setShowStickyBuy(rect.bottom < 60); // 60px from top
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (listing?.seller) {
      const bio = sessionStorage.getItem(`profile_bio_${listing.seller}`);
      const pic = sessionStorage.getItem(`profile_pic_${listing.seller}`);
      const price = sessionStorage.getItem(`subscription_price_${listing.seller}`);
      setSellerProfile({ bio, pic, subscriptionPrice: price });
    }
  }, [listing?.seller]);

  useEffect(() => {
    if (
      listing?.seller &&
      currentUsername &&
      !hasMarkedRef.current
    ) {
      markMessagesAsRead(listing.seller, currentUsername);
      hasMarkedRef.current = true;
    }
  }, [listing?.seller, currentUsername, markMessagesAsRead]);

  const sellerUser = users?.[listing?.seller ?? ''];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  if (!listingId) {
    return <div className="text-white text-center p-10">Invalid listing URL.</div>;
  }

  if (!listing) {
    return <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>;
  }

  const images = listing.imageUrls || [];

  // Image navigation (looping)
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <main className="min-h-screen bg-black text-white py-6 px-2 sm:px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/browse" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition text-sm">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Browse
          </Link>
        </div>

        {/* Listing Detail Card */}
        <div className="bg-gradient-to-br from-[#181818] via-black to-[#181818] border border-gray-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row gap-8 overflow-hidden p-0">
          {/* Left: Image Gallery */}
          <div className="flex-1 flex flex-col items-center lg:items-start p-4 sm:p-6 lg:p-6">
            {/* Main Image with arrows only (no orange pill) */}
            <div ref={imageRef} className="relative w-full max-w-md lg:max-w-none pb-0">
              <div className="relative w-full h-[520px] rounded-3xl overflow-hidden shadow-xl bg-[#232323] border border-[#232323] flex items-center justify-center">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          aria-label="Previous image"
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent text-[#ff950e] rounded-full z-10 transition"
                          style={{ opacity: 0.6, padding: 0 }}
                        >
                          <ChevronLeft className="w-10 h-10" />
                        </button>
                        <button
                          aria-label="Next image"
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-[#ff950e] rounded-full z-10 transition"
                          style={{ opacity: 0.6, padding: 0 }}
                        >
                          <ChevronRight className="w-10 h-10" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 rounded-3xl">
                    No Image Available
                  </div>
                )}
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="w-full max-w-md lg:max-w-none overflow-x-auto flex gap-3 pb-2 mt-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${index === currentImageIndex ? 'border-[#ff950e]' : 'border-gray-700 hover:border-gray-600'}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-6">
            <div className="text-left">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">{listing.title}</h1>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag, i) => (
                    <span key={i} className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Seller Badges */}
              <div className="flex gap-3 mb-5">
                {isVerified ? (
                  <span className="flex items-center gap-1 text-xs bg-[#232323] text-[#ff950e] px-3 py-1 rounded-full font-semibold">
                    <BadgeCheck className="w-4 h-4" /> Verified Seller
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-3 py-1 rounded-full font-semibold">
                    <AlertTriangle className="w-4 h-4" /> Unverified Seller
                  </span>
                )}
              </div>

              {/* Info Row: Hours worn */}
              {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                <div className="flex items-center mb-6">
                  <span className="flex items-center gap-2 bg-[#181818]/80 border border-[#232323] rounded-xl px-5 py-3 shadow-inner text-sm text-gray-300 font-semibold w-fit">
                    <Clock className="w-4 h-4 text-[#ff950e]" />
                    {listing.hoursWorn} hours worn
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-base text-gray-300 leading-relaxed mb-6">{listing.description}</p>

              {/* Price and Action Buttons */}
              <div className="w-full max-w-sm mx-0 flex flex-col items-center mb-6">
                <div className="flex justify-center w-full mb-4">
                  <span className="flex items-center gap-2 text-3xl font-extrabold text-[#ff950e] bg-[#232323] px-6 py-3 rounded-full shadow border border-[#232323] w-fit mx-auto">
                    <DollarSign className="w-6 h-6" style={{ marginRight: '0.15em' }} />
                    <span className="ml-1">{listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}</span>
                  </span>
                </div>
                {user?.role === 'buyer' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={() => {
                        setIsProcessing(true);
                        const success = purchaseListing(listing, user.username);
                        if (success) {
                          removeListing(listing.id);
                          addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
                          setPurchaseStatus('Purchase successful! 🎉');
                          setTimeout(() => {
                            window.location.href = `/buyers/messages?seller=${listing.seller}`;
                          }, 1000);
                        } else {
                          setPurchaseStatus('Insufficient balance. Please top up your wallet.');
                          setIsProcessing(false);
                        }
                      }}
                      className="flex-1 bg-[#ff950e] text-black px-4 py-2 rounded-full hover:bg-[#e0850d] font-bold text-base shadow-lg transition focus:scale-105 active:scale-95"
                      disabled={isProcessing}
                      style={{
                        boxShadow: '0 2px 12px 0 #ff950e44',
                        transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                      }}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingBag className="w-5 h-5 animate-pulse" /> Processing...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ShoppingBag className="w-5 h-5" /> Buy Now
                        </span>
                      )}
                    </button>
                    <Link
                      href={`/buyers/messages?thread=${listing.seller}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold text-base shadow-lg transition"
                      style={{ borderRadius: '9999px' }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message {listing.seller}
                    </Link>
                  </div>
                )}
                {/* Seller Info Card below buttons */}
                {user?.role === 'buyer' && (
                  <div className="flex items-center gap-4 bg-[#181818]/80 border border-[#232323] rounded-2xl px-5 py-4 mt-6 mb-2 shadow-inner w-full">
                    {sellerProfile.pic ? (
                      <img
                        src={sellerProfile.pic}
                        alt={listing.seller}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#ff950e] shadow"
                      />
                    ) : (
                      <User className="w-12 h-12 text-[#ff950e] bg-black rounded-full p-2 border-2 border-[#ff950e]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-white truncate">{listing.seller}</span>
                        {isVerified ? (
                          <span className="flex items-center gap-1 text-xs bg-[#ff950e] text-black px-2 py-1 rounded-full font-bold shadow">
                            <BadgeCheck className="w-4 h-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-2 py-1 rounded-full font-bold shadow">
                            <AlertTriangle className="w-4 h-4" />
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{sellerProfile.bio || 'No bio provided.'}</p>
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="inline-block mt-2 bg-black border border-[#ff950e] text-[#ff950e] font-bold px-3 py-1.5 rounded-full text-xs hover:bg-[#ff950e] hover:text-black transition"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Status Message */}
              {purchaseStatus && (
                <p className={`text-lg font-semibold ${purchaseStatus.includes('successful') ? 'text-green-500' : 'text-red-500'} mt-4`}>
                  {purchaseStatus}
                </p>
              )}

              {/* Premium Content Lock Message */}
              {needsSubscription && (
                <div className="bg-yellow-700 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 mt-6">
                  <Lock className="w-6 h-6 text-yellow-200" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Premium Content</h3>
                    <p className="text-sm">This is a premium listing. Subscribe to {listing.seller} to view its full details and purchase.</p>
                    {user?.role === 'buyer' && (
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="inline-block mt-3 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-400 transition"
                      >
                        View {listing.seller}'s Profile
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Buy Now for mobile */}
        {user?.role === 'buyer' && !needsSubscription && (
          <div className={`fixed bottom-0 left-0 w-full z-40 pointer-events-none sm:hidden`}>
            <div className={`transition-all duration-300 ${showStickyBuy ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <div className="max-w-md mx-auto px-4 pb-4">
                <button
                  onClick={() => {
                    setIsProcessing(true);
                    const success = purchaseListing(listing, user.username);
                    if (success) {
                      removeListing(listing.id);
                      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
                      setPurchaseStatus('Purchase successful! 🎉');
                      setTimeout(() => {
                        window.location.href = `/buyers/messages?seller=${listing.seller}`;
                      }, 1000);
                    } else {
                      setPurchaseStatus('Insufficient balance. Please top up your wallet.');
                      setIsProcessing(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-[#e0850d] transition focus:scale-105 active:scale-95"
                  style={{
                    boxShadow: '0 2px 12px 0 #ff950e44',
                    transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <ShoppingBag className="w-5 h-5 animate-pulse" /> Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
