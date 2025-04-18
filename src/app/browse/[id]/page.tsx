'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import Link from 'next/link';

export default function ListingDetailPage() {
  const { listings, user, removeListing } = useListings();
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);
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

  const currentUsername = user?.username || '';
  const conversation = listing?.seller
    ? getMessagesForSeller(listing.seller).filter(
        (msg) =>
          (msg.sender === currentUsername && msg.receiver === listing.seller) ||
          (msg.sender === listing.seller && msg.receiver === currentUsername)
      )
    : [];

  const hasMarkedRef = useRef(false);

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
    return <p className="p-10 text-lg font-medium">Listing not found.</p>;
  }

  const handlePurchase = () => {
    const order = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      markedUpPrice: listing.markedUpPrice,
      imageUrl: listing.imageUrl,
      date: new Date().toISOString(),
      seller: listing.seller,
    };

    const isPurchased = purchaseListing(order, currentUsername);

    if (isPurchased) {
      setIsProcessing(true);
      removeListing(listing.id);
      setPurchaseStatus('✅ Purchase successful!');
      setTimeout(() => {
        router.push('/purchase-success');
      }, 1500);
    } else {
      setPurchaseStatus('❌ Insufficient funds!');
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    sendMessage(user.username, listing.seller, message);
    setSent(true);
    setMessage('');
    setTimeout(() => {
      setSent(false);
    }, 1500);
  };

  return (
    <main className="p-10 max-w-2xl mx-auto relative">
      <img
        src={listing.imageUrl}
        alt={listing.title}
        className="w-full h-64 object-cover rounded mb-6"
      />
      <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
      <p className="text-gray-700 mb-4">{listing.description}</p>

      <p className="text-xl font-semibold text-pink-600 mb-2">
        Price: ${listing.markedUpPrice.toFixed(2)}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <button
          onClick={handlePurchase}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
          disabled={purchaseStatus.includes('✅') || isProcessing}
        >
          Buy Now
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white border border-pink-600 text-pink-600 px-4 py-2 rounded hover:bg-pink-50"
        >
          Message Seller 💬
        </button>

        <Link
          href={`/sellers/${listing.seller}`}
          className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center"
        >
          Visit {listing.seller}&apos;s Profile
        </Link>
      </div>

      {purchaseStatus && (
        <p className="mt-2 font-semibold text-sm">{purchaseStatus}</p>
      )}

      {isProcessing && (
        <p className="text-sm text-pink-500 mt-1">Processing your purchase...</p>
      )}

      <p className="text-sm text-gray-500 mt-2">
        Your Balance: ${getBuyerBalance(currentUsername).toFixed(2)}
      </p>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-black relative">
            <h2 className="text-xl font-semibold mb-3">
              Chat with {listing.seller}
            </h2>

            {/* Thread Preview */}
            <div className="border rounded p-2 mb-4 h-40 overflow-y-auto bg-gray-50">
              {conversation.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                conversation.map((msg, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs text-gray-500">
                      {msg.sender === user?.username ? 'You' : msg.sender} —{' '}
                      {new Date(msg.date).toLocaleString()}
                    </p>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-24 p-2 border rounded mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                {sent ? '✅ Sent!' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
