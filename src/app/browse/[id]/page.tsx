'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import Link from 'next/link';
import { Crown, Clock, MessageCircle, ShoppingBag, User, Lock, Star } from 'lucide-react';

export default function ListingDetailPage() {
  const { listings, user, isSubscribed, addSellerNotification, recordSale } = useListings();
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);
  const { purchaseListing } = useWallet();
  const {
    sendMessage,
    getMessagesForSeller,
    markMessagesAsRead,
  } = useMessages();
  const router = useRouter();

  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<{
    bio?: string | null;
    pic?: string | null;
    subscriptionPrice?: string | null;
  }>({});

  const currentUsername = user?.username || '';
  const conversation = listing?.seller
    ? getMessagesForSeller(listing.seller).filter(
        (msg) =>
          (msg.sender === currentUsername && msg.receiver === listing.seller) ||
          (msg.sender === listing.seller && msg.receiver === currentUsername)
      )
    : [];

  const hasMarkedRef = useRef(false);
  const isSubscribedToSeller = user?.username && listing?.seller ? 
    isSubscribed(user.username, listing.seller) : false;
  const needsSubscription = listing?.isPremium && !isSubscribedToSeller;

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
      isModalOpen &&
      listing?.seller &&
      currentUsername &&
      !hasMarkedRef.current
    ) {
      markMessagesAsRead(listing.seller, currentUsername);
      hasMarkedRef.current = true;
    }
  }, [isModalOpen, listing?.seller, currentUsername, markMessagesAsRead]);

  if (!listing) {
    return <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>;
  }

  const handlePurchase = () => {
    if (!listing || !user) return;
    
    // Use purchaseListing from WalletContext to handle the transaction
    const isPurchased = purchaseListing(listing, user.username);

    if (isPurchased) {
      setIsProcessing(true);
      
      // Create a sale record with appropriate information
      const sale = {
        id: Date.now().toString(),
        listingId: listing.id,
        listingTitle: listing.title,
        buyer: user.username,
        seller: listing.seller,
        price: listing.markedUpPrice || listing.price,
        commissionAmount: (listing.markedUpPrice || listing.price) * 0.10, // 10% fee
        sellerEarnings: (listing.markedUpPrice || listing.price) * 0.90, // 90% to seller
        date: new Date().toISOString(),
        imageUrl: listing.imageUrl
      };
      
      // Record the sale - this will:
      // 1. Update the listing status to 'sold'
      // 2. Add a notification for the seller
      // 3. Add the sale to the sales records
      recordSale(sale);
      
      // Find the seller ID
      const sellerId = getSellerIdByUsername(listing.seller);
      
      // Add a notification specifically for this seller
      if (sellerId) {
        addSellerNotification(sellerId, `💸 You made a sale: ${listing.title}`);
      }
      
      setPurchaseStatus('✅ Purchase successful!');
      setTimeout(() => {
        router.push('/purchase-success');
      }, 1500);
    } else {
      setPurchaseStatus('❌ Insufficient funds!');
    }
  };
  
  // Helper function to get seller ID by username
  const getSellerIdByUsername = (username: string): string => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return '';
    
    const users = JSON.parse(storedUsers);
    const seller = users.find((user: any) => user.username === username && user.role === 'seller');
    
    return seller ? seller.id : '';
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user || !listing?.seller) return;

    sendMessage(user.username, listing.seller, message);
    setSent(true);
    setMessage('');
    setTimeout(() => {
      setSent(false);
    }, 1500);
  };

  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Image */}
        <div className="lg:col-span-2">
          <div className="relative">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-96 object-cover rounded-lg shadow-sm"
            />
            {listing.isPremium && (
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-500 text-white font-semibold px-3 py-1.5 rounded-full flex items-center">
                  <Crown className="w-4 h-4 mr-1.5" /> Premium Listing
                </span>
              </div>
            )}
            {listing.wearTime && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1.5 rounded-md flex items-center">
                <Clock className="w-4 h-4 mr-1.5" /> {listing.wearTime}
              </div>
            )}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">{listing.title}</h1>
            
            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 mb-4">
                {listing.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <p className="text-gray-700 mt-4 mb-6 leading-relaxed">{listing.description}</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <p className="text-2xl font-semibold text-pink-600">
                ${(listing.markedUpPrice || listing.price).toFixed(2)}
              </p>
              
              <p className="text-sm text-gray-700 mt-2">
                Your Balance: ${user?.role === 'buyer' ? 
                  (useWallet().buyerWallet.balance || 0).toFixed(2) : 
                  '0.00'}
              </p>
            </div>

            {/* Purchase and message buttons */}
            {!needsSubscription ? (
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handlePurchase}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg flex-1 flex items-center justify-center gap-2 font-medium"
                  disabled={purchaseStatus.includes('✅') || isProcessing}
                >
                  <ShoppingBag className="w-5 h-5" />
                  Buy Now
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white border-2 border-pink-600 text-pink-600 px-6 py-3 rounded-lg hover:bg-pink-50 flex-1 flex items-center justify-center gap-2 font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  Message Seller
                </button>
              </div>
            ) : (
              <div className="mt-6 bg-yellow-600 border-2 border-yellow-500 rounded-lg p-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="text-yellow-200 w-5 h-5" />
                  <h3 className="font-semibold">Premium Content</h3>
                </div>
                <p className="mb-3">
                  This is a premium listing from {listing.seller}. Subscribe to access this content.
                </p>
                <Link
                  href={`/sellers/${listing.seller}`}
                  className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
                >
                  <Crown className="w-5 h-5" />
                  Subscribe for ${sellerProfile.subscriptionPrice || '...'}/month
                </Link>
              </div>
            )}

            {purchaseStatus && (
              <p className="mt-4 font-semibold text-sm">{purchaseStatus}</p>
            )}

            {isProcessing && (
              <p className="text-sm text-pink-500 mt-2">Processing your purchase...</p>
            )}
          </div>
        </div>

        {/* Right column - Seller info and related listings */}
        <div className="space-y-6">
          {/* Seller Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Seller Information</h2>
            <div className="flex items-center gap-4 mb-4">
              {sellerProfile.pic ? (
                <img 
                  src={sellerProfile.pic}
                  alt={`${listing.seller}'s profile`}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <Link href={`/sellers/${listing.seller}`} className="font-semibold text-lg hover:text-pink-600 text-gray-800">
                  {listing.seller}
                </Link>
                <div className="flex items-center mt-1">
                  <span className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 text-gray-300" />
                  </span>
                  <span className="text-xs text-gray-500 ml-1">(4.0)</span>
                </div>
              </div>
            </div>

            {sellerProfile.bio && (
              <p className="text-sm text-gray-700 mb-4">
                {sellerProfile.bio.length > 120 
                  ? sellerProfile.bio.substring(0, 120) + '...' 
                  : sellerProfile.bio}
              </p>
            )}

            <div className="flex gap-3">
              <Link 
                href={`/sellers/${listing.seller}`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded py-2 px-4 text-sm flex-1 text-center"
              >
                View Profile
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-pink-100 hover:bg-pink-200 text-pink-800 rounded py-2 px-4 text-sm flex-1"
              >
                Message
              </button>
            </div>
          </div>

          {/* Subscription box - shown only for premium sellers */}
          {sellerProfile.subscriptionPrice && (
            <div className={`rounded-lg shadow-sm p-5 ${isSubscribedToSeller 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Crown className={`w-5 h-5 ${isSubscribedToSeller ? 'text-green-200' : 'text-yellow-200'}`} />
                <h2 className="font-semibold">
                  {isSubscribedToSeller ? 'Active Subscription' : 'Premium Seller'}
                </h2>
              </div>
              
              {isSubscribedToSeller ? (
                <div>
                  <p className="text-sm mb-2">
                    You are subscribed to {listing.seller}
                  </p>
                  <p className="text-xs text-green-200">
                    You have access to all premium content
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3">
                    Subscribe to {listing.seller} for ${sellerProfile.subscriptionPrice}/month
                    to access all premium listings
                  </p>
                  <Link
                    href={`/sellers/${listing.seller}`}
                    className="bg-yellow-500 hover:bg-yellow-400 text-white py-2 px-4 rounded font-medium text-sm block text-center"
                  >
                    Subscribe Now
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Similar listings suggestion - would be implemented with actual data in a real app */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">You Might Also Like</h2>
            <p className="text-sm text-gray-700 italic">
              Similar listings would appear here in a full implementation
            </p>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-black relative">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-800">
              <MessageCircle className="w-5 h-5 text-pink-600" />
              Chat with {listing.seller}
            </h2>

            {/* Thread Preview */}
            <div className="border rounded p-3 mb-4 h-48 overflow-y-auto bg-gray-50">
              {conversation.length === 0 ? (
                <p className="text-sm text-gray-600 italic">No messages yet. Start the conversation!</p>
              ) : (
                conversation.map((msg, i) => (
                  <div key={i} className={`mb-3 p-2 rounded ${
                    msg.sender === user?.username 
                      ? 'bg-pink-50 border border-pink-100 ml-6' 
                      : 'bg-gray-100 border border-gray-200 mr-6'
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">
                      {msg.sender === user?.username ? 'You' : msg.sender} —{' '}
                      {new Date(msg.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-800">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-24 p-3 border rounded-lg mb-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-gray-800"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed"
              >
                {sent === true ? '✅ Sent!' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}