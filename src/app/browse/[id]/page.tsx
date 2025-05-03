'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import Link from 'next/link';
import { Clock, User, ArrowRight, BadgeCheck, AlertTriangle, Crown, MessageCircle, DollarSign, ShoppingBag, Eye, Lock } from 'lucide-react'; // Added Eye and Lock icons
import { v4 as uuidv4 } from 'uuid';

export default function ListingDetailPage() {
  const { listings, user, removeListing, addSellerNotification, isSubscribed, users } = useListings();
  const { id } = useParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const listing = listings.find((item) => item.id === listingId);
  const { getBuyerBalance, purchaseListing } = useWallet();
  const {
    sendMessage,
    getMessagesForSeller,
    markMessagesAsRead,
  } = useMessages();
  const { addRequest } = useRequests();
  const router = useRouter();

  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sendAsRequest, setSendAsRequest] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestPrice, setRequestPrice] = useState<number | ''>('');
  const [requestTags, setRequestTags] = useState('');
  const [sellerProfile, setSellerProfile] = useState<{ bio?: string | null; pic?: string | null; subscriptionPrice?: string | null; }>({});

  const currentUsername = user?.username || '';
  // Note: Conversation filtering logic remains the same
  const conversation = listing?.seller
    ? getMessagesForSeller(listing.seller).filter(
        (msg) =>
          (msg.sender === currentUsername && msg.receiver === listing.seller) ||
          (msg.sender === listing.seller && msg.receiver === currentUsername)
      )
    : [];

  const hasMarkedRef = useRef(false);
  const isSubscribedToSeller = user?.username && listing?.seller ? isSubscribed(user.username, listing.seller) : false;
  const needsSubscription = listing?.isPremium && !isSubscribedToSeller;

  // State for the currently displayed image in the gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // FIX: Only increment view ONCE per mount, even in React Strict Mode
  const hasIncrementedView = useRef(false);
  const [views, setViews] = useState(0); // State for views
  useEffect(() => {
    if (!listing?.id) return;
    if (typeof window !== 'undefined') {
      const viewsData = JSON.parse(localStorage.getItem('listing_views') || '{}');
      const currentViews = viewsData[listing.id] || 0;
      setViews(currentViews); // Set initial views

      if (!hasIncrementedView.current) {
        hasIncrementedView.current = true;
        viewsData[listing.id] = currentViews + 1;
        localStorage.setItem('listing_views', JSON.stringify(viewsData));
        setViews(currentViews + 1); // Update views state after incrementing
      }

      // Listen for storage changes to update views in real-time across tabs
      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'listing_views') {
          const updatedViewsData = JSON.parse(event.newValue || '{}');
          setViews(updatedViewsData[listing.id] || 0);
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [listing?.id]); // Depend on listing.id

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

  // --- VERIFIED BADGE LOGIC ---
  const sellerUser = users?.[listing?.seller ?? ''];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  if (!listingId) {
    return <div className="text-white text-center p-10">Invalid listing URL.</div>;
  }

  if (!listing) {
    return <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>;
  }

  // Note: handleSend logic remains the same
  const handleSend = () => {
    if (!user || !listing?.seller || !message.trim()) return;

    // Always include the listing id in meta for ALL messages
    sendMessage(
      user.username,
      listing.seller,
      message.trim(),
      {
        type: sendAsRequest ? 'customRequest' : 'normal',
        meta: {
          id: listing.id,
          ...(sendAsRequest
            ? {
                title: requestTitle.trim(),
                price: Number(requestPrice),
                tags: requestTags.split(',').map(tag => tag.trim()).filter(Boolean),
                message: message.trim(),
              }
            : {})
        }
      }
    );

    if (sendAsRequest) {
      if (!requestTitle.trim() || !requestPrice || isNaN(Number(requestPrice))) {
        alert('Please enter a valid title and price for your custom request.');
        return;
      }
      const tagsArray = requestTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const requestId = uuidv4();
      addRequest({
        id: requestId,
        buyer: user.username,
        seller: listing.seller,
        title: requestTitle.trim(),
        description: message.trim(),
        price: Number(requestPrice),
        tags: tagsArray,
        status: 'pending',
        date: new Date().toISOString(),
      });
    }

    setSent(true);
    setMessage('');
    setRequestTitle('');
    setRequestPrice('');
    setRequestTags('');
    setTimeout(() => setSent(false), 1500);
  };

  const images = listing.imageUrls || []; // Use the imageUrls array

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/browse" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition text-sm">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Browse
          </Link>
        </div>

        {/* Listing Detail Card */}
        <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-800 flex flex-col lg:flex-row gap-8">

          {/* Left side: Image Gallery & Seller Info */}
          <div className="flex-1 flex flex-col items-center lg:items-start">
            {/* Main Image Display */}
            <div className="w-full max-w-md lg:max-w-none rounded-2xl overflow-hidden shadow-xl border border-gray-700 mb-4">
               {images.length > 0 ? (
                 <img
                   src={images[currentImageIndex]}
                   alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                   className="w-full h-64 sm:h-80 object-cover"
                 />
               ) : (
                 <div className="w-full h-64 sm:h-80 bg-gray-700 flex items-center justify-center text-gray-400">
                   No Image Available
                 </div>
               )}
            </div>

            {/* Image Thumbnails (Scrollable) */}
            {images.length > 1 && (
              <div className="w-full max-w-md lg:max-w-none overflow-x-auto flex gap-3 pb-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition ${index === currentImageIndex ? 'border-[#ff950e]' : 'border-gray-700 hover:border-gray-600'}`}
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


            {/* Quick Info Row */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-gray-400 text-sm mt-6 mb-6">
                {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {listing.hoursWorn} hours worn
                  </span>
                )}
                 <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {views} views
                 </span>
                 <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Price: <span className="text-[#ff950e] font-bold">${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}</span>
                 </span>
            </div>

             {/* Seller profile quick link */}
            <div className="w-full flex flex-col items-center lg:items-start">
              <Link
                href={`/sellers/${listing.seller}`}
                className="inline-flex items-center gap-3 bg-black border-2 border-[#ff950e] text-[#ff950e] font-bold px-6 py-3 rounded-full shadow-lg hover:bg-[#ff950e] hover:text-black transition mb-3"
                style={{ transition: 'all 0.15s' }}
              >
                {sellerProfile.pic ? (
                  <img
                    src={sellerProfile.pic}
                    alt={listing.seller}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
                <span>View {listing.seller}'s Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {sellerProfile.bio && (
                <p className="text-sm text-gray-400 text-center lg:text-left max-w-xs leading-relaxed">
                  {sellerProfile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Listing Details & Actions */}
          <div className="flex-1 space-y-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{listing.title}</h1>

            {/* Seller Info & Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-gray-400">by</span>
              <Link href={`/sellers/${listing.seller}`} className="text-[#ff950e] font-bold hover:underline">
                {listing.seller}
              </Link>
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
               {listing.isPremium && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold shadow">
                    <Crown className="w-4 h-4" />
                    Premium
                  </span>
               )}
            </div>

            {/* Description */}
            <p className="text-base text-gray-300 leading-relaxed">{listing.description}</p>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag, i) => (
                  <span key={i} className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {user?.role === 'buyer' ? (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mt-6">
                <button
                  onClick={() => {
                    setIsProcessing(true);
                    const success = purchaseListing(listing, user.username);
                    if (success) {
                      removeListing(listing.id);
                      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
                      setPurchaseStatus('Purchase successful! 🎉');
                      // Redirect to seller's messages after a short delay
                      setTimeout(() => {
                        window.location.href = `/buyers/messages?seller=${listing.seller}`;
                      }, 1000);
                    } else {
                      setPurchaseStatus('Insufficient balance. Please top up your wallet.');
                      setIsProcessing(false);
                    }
                  }}
                  className="flex-1 bg-[#ff950e] text-black px-6 py-3 rounded-lg hover:bg-[#e0850d] font-bold text-lg shadow-lg transition focus:scale-105 active:scale-95"
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
                  href={`/buyers/messages?thread=${listing.seller}`} // Assuming message page takes thread query param
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-bold text-lg shadow-lg transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message {listing.seller}
                </Link>
              </div>
            ) : user?.role === 'seller' ? (
              <div className="bg-blue-700 text-white p-4 rounded-lg shadow-lg mt-6">
                <p className="text-sm">
                  You are viewing this page as a seller. You can browse listings but cannot make purchases.
                </p>
              </div>
            ) : null}

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

             {/* Message/Request Form (if needed - currently not in original code, but included handleSend) */}
             {/* You can uncomment and style this section if you want messaging directly on this page */}
             {/*
             <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-xl font-bold mb-4 text-white">Contact {listing.seller}</h3>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Send a message or make a custom request..."
                  className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] h-28 mb-4"
                />
                <div className="flex items-center gap-2 mb-4">
                   <input
                     type="checkbox"
                     checked={sendAsRequest}
                     onChange={() => setSendAsRequest(!sendAsRequest)}
                     className="h-4 w-4 text-[#ff950e] focus:ring-[#ff950e] rounded border-gray-600 bg-black checked:bg-[#ff950e]"
                   />
                   <label className="text-sm text-gray-300">Send as Custom Request</label>
                </div>
                {sendAsRequest && (
                   <div className="space-y-4 mb-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Request Title</label>
                         <input
                           type="text"
                           value={requestTitle}
                           onChange={(e) => setRequestTitle(e.target.value)}
                           className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                           placeholder="e.g. 'Custom worn socks'"
                         />
                      </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Request Price ($)</label>
                         <input
                           type="number"
                           value={requestPrice}
                           onChange={(e) => setRequestPrice(e.target.value === '' ? '' : Number(e.target.value))}
                           className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                           placeholder="e.g. 50.00"
                           min="0"
                         />
                      </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Request Tags (comma separated)</label>
                         <input
                           type="text"
                           value={requestTags}
                           onChange={(e) => setRequestTags(e.target.value)}
                           className="w-full p-3 border border-gray-700 rounded-lg bg-black text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                           placeholder="e.g. socks, gym, custom"
                         />
                      </div>
                   </div>
                )}
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg transition"
                >
                  {sendAsRequest ? 'Send Custom Request' : 'Send Message'}
                </button>
                {sent && <p className="text-green-500 mt-2 text-sm">✅ Message sent!</p>}
             </div>
             */}

          </div>
        </div>
      </div>
    </main>
  );
}
