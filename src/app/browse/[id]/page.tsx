'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext'; // ✅ Import messages context

export default function ListingDetailPage() {
  const { listings, user } = useListings();
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);
  const { buyerBalance, purchaseListing } = useWallet();
  const { sendMessage } = useMessages();
  const router = useRouter();

  const [purchaseStatus, setPurchaseStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

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

    const isPurchased = purchaseListing(order);

    if (isPurchased) {
      setPurchaseStatus('✅ Purchase successful!');
      setTimeout(() => {
        router.push('/purchase-success');
      }, 1500);
    } else {
      setPurchaseStatus('❌ Insufficient funds!');
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (!user) return;

    sendMessage(user.username, listing.seller, message); // ✅ Save the message
    setSent(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setMessage('');
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

      <div className="flex gap-4 mb-4">
        <button
          onClick={handlePurchase}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
        >
          Buy Now
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white border border-pink-600 text-pink-600 px-4 py-2 rounded hover:bg-pink-50"
        >
          Message Seller 💬
        </button>
      </div>

      {purchaseStatus && (
        <p className="mt-2 font-semibold text-sm">{purchaseStatus}</p>
      )}

      <p className="text-sm text-gray-500 mt-2">
        Your Balance: ${buyerBalance.toFixed(2)}
      </p>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl text-black">
            <h2 className="text-xl font-semibold mb-2">Send a message to {listing.seller}</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-2 border rounded mb-4"
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
