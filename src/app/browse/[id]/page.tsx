'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import Link from 'next/link';
import { Crown, Clock, MessageCircle, ShoppingBag, User, Lock, Star, ArrowRight, BadgeCheck, AlertTriangle } from 'lucide-react';
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

  // Increment view count in localStorage ONCE per session per listing
  useEffect(() => {
    if (!listing?.id) return;
    if (typeof window !== 'undefined') {
      const sessionKey = `viewed_listing_${listing.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
        const viewsData = JSON.parse(localStorage.getItem('listing_views') || '{}');
        viewsData[listing.id] = (viewsData[listing.id] || 0) + 1;
        localStorage.setItem('listing_views', JSON.stringify(viewsData));
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [listing?.id]);

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

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 bg-[#171717] rounded-2xl shadow-xl p-6 border border-[#222]">
        <div className="flex-1 flex flex-col items-center">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-64 object-cover rounded-xl shadow-md mb-4"
          />
          {/* Show hoursWorn if available */}
          {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
            <div className="mt-2 flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5" />
              <span>{listing.hoursWorn} hours worn</span>
            </div>
          )}
          {/* Seller profile quick link */}
          <div className="mt-6 w-full flex flex-col items-center">
            <Link
              href={`/sellers/${listing.seller}`}
              className="flex items-center gap-2 bg-white border-2 border-[#ff950e] text-[#ff950e] font-semibold px-4 py-2 rounded-full shadow hover:bg-[#ff950e] hover:text-white transition mb-2"
              style={{ transition: 'all 0.15s' }}
            >
              {sellerProfile.pic ? (
                <img
                  src={sellerProfile.pic}
                  alt={listing.seller}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <User className="w-7 h-7" />
              )}
              <span>View {listing.seller}'s Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {sellerProfile.bio && (
              <p className="text-xs text-gray-400 text-center max-w-xs">{sellerProfile.bio}</p>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400">by</span>
            <Link href={`/sellers/${listing.seller}`} className="text-primary font-bold hover:underline">
              {listing.seller}
            </Link>
            {isVerified ? (
              <span className="flex items-center gap-1 text-xs bg-[#ff950e] text-black px-2 py-0.5 rounded-full font-semibold">
                <BadgeCheck className="w-4 h-4" />
                Verified Seller
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-2 py-0.5 rounded-full font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Unverified Seller
              </span>
            )}
          </div>
          <p className="text-lg text-gray-300">{listing.description}</p>
          {listing.tags && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag, i) => (
                <span key={i} className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            <p className="text-2xl font-bold text-pink-600">${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}</p>
            <span className="text-lg text-gray-300 flex items-center gap-1">
              <User className="w-5 h-5" />
              {listing.seller}
            </span>
          </div>
          {user?.role === 'buyer' && (
            <div className="flex flex-col gap-3 w-full max-w-xs">
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
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 font-medium w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Buy Now'}
              </button>
              <button
                onClick={() => {
                  // Redirect to buyers/messages with thread open
                  window.location.href = `/buyers/messages?thread=${listing.seller}`;
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium w-full"
              >
                Message {listing.seller}
              </button>
            </div>
          )}
          {user?.role === 'seller' && (
            <div className="bg-blue-600 text-white p-4 rounded-lg">
              <p className="text-sm">
                You are viewing this page as a seller. You can browse listings but cannot make purchases.
              </p>
            </div>
          )}
          {purchaseStatus && <p className="text-lg text-green-500">{purchaseStatus}</p>}
        </div>
      </div>
    </main>
  );
}
