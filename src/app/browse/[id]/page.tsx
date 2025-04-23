'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import Link from 'next/link';
import { Crown, Clock, MessageCircle, ShoppingBag, User, Lock, Star } from 'lucide-react';

export default function ListingDetailPage() {
  const { listings, user, removeListing, addSellerNotification, isSubscribed } = useListings();
  const { id } = useParams();
  const listingId = Array.isArray(id) ? id[0] : id;
  const listing = listings.find((item) => item.id === listingId);
  const { getBuyerBalance, purchaseListing } = useWallet();
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

  // Debugging logs
  console.log('Listings:', listings);
  console.log('Listing ID:', listingId);
  console.log('Listing:', listing);
  console.log('User:', user);

  if (!listingId) {
    return <div className="text-white text-center p-10">Invalid listing URL.</div>;
  }

  if (!listing) {
    return <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>;
  }

  const handleSend = () => {
    if (!user || !listing?.seller || !message.trim()) return;

    let finalMessage = message.trim();

    if (sendAsRequest) {
      if (!requestTitle.trim() || !requestPrice || isNaN(Number(requestPrice))) {
        alert('Please enter a valid title and price for your custom request.');
        return;
      }

      const tagsArray = requestTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const payload = {
        title: requestTitle.trim(),
        price: Number(requestPrice),
        tags: tagsArray,
        message: finalMessage,
      };

      finalMessage = `[REQUEST]::${JSON.stringify(payload)}`;
    }

    sendMessage(user.username, listing.seller, finalMessage);

    setSent(true);
    setMessage('');
    setRequestTitle('');
    setRequestPrice('');
    setRequestTags('');
    setTimeout(() => setSent(false), 1500);
  };

  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
          {listing.wearTime && (
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{listing.wearTime}</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-white">{listing.title}</h1>
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
            <Link href={`/sellers/${listing.seller}`} className="text-lg text-gray-300 hover:text-pink-600">
              {listing.seller}
            </Link>
          </div>
          {user?.role === 'buyer' && (
            <button
              onClick={() => {
                const success = purchaseListing(listing, user.username);
                if (success) {
                  removeListing(listing.id);
                  addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
                  setPurchaseStatus('Purchase successful! 🎉');
                } else {
                  setPurchaseStatus('Insufficient balance. Please top up your wallet.');
                }
                setIsProcessing(false);
              }}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 font-medium"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Buy Now'}
            </button>
          )}
          {purchaseStatus && <p className="text-lg text-green-500">{purchaseStatus}</p>}
          {user?.role === 'buyer' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Message {listing.seller}
            </button>
          )}
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

            <div className="border rounded p-3 mb-4 h-48 overflow-y-auto bg-gray-50">
              {conversation.length === 0 ? (
                <p className="text-sm text-gray-600 italic">No messages yet. Start the conversation!</p>
              ) : (
                conversation.map((msg, i) => (
                  <div key={i} className={`mb-3 p-2 rounded ${
                    msg.sender === user?.username ? 'bg-pink-50 border border-pink-100 ml-6' : 'bg-gray-100 border border-gray-200 mr-6'
                  }`}>
                    <p className="text-xs text-gray-600 mb-1">
                      {msg.sender === user?.username ? 'You' : msg.sender} — {new Date(msg.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-800">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={sendAsRequest}
                onChange={() => setSendAsRequest(prev => !prev)}
              />
              <label className="text-sm font-medium text-gray-700">Send as custom request</label>
            </div>

            {sendAsRequest && (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price (USD)"
                  value={requestPrice}
                  onChange={(e) => setRequestPrice(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={requestTags}
                  onChange={(e) => setRequestTags(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}

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
              >Cancel</button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed"
              >{sent ? '✅ Sent!' : sendAsRequest ? 'Send Request' : 'Send Message'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
