'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';

export default function ListingDetailPage() {
  const { listings } = useListings();
  const { id } = useParams();
  const listing = listings.find((item) => item.id === id);
  const { buyerBalance, purchaseListing } = useWallet();
  const router = useRouter();
  const [purchaseStatus, setPurchaseStatus] = useState<string>('');

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
      seller: listing.seller, // ✅ Include seller here
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

  return (
    <main className="p-10 max-w-2xl mx-auto">
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

      <button
        onClick={handlePurchase}
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
      >
        Buy Now
      </button>

      {purchaseStatus && (
        <p className="mt-4 font-semibold text-sm">{purchaseStatus}</p>
      )}

      <p className="text-sm text-gray-500 mt-2">
        Your Balance: ${buyerBalance.toFixed(2)}
      </p>
    </main>
  );
}
