'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useListings, Listing } from '@/context/ListingContext';
import MessageModal from '@/components/MessageModal';

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { listings, purchaseListing, role } = useListings();
  const [isMessaging, setIsMessaging] = useState(false);

  // ✅ Ensure ID is a string
  if (typeof id !== 'string') {
    return <div className="p-10">Invalid listing ID</div>;
  }

  // ✅ Safely find and cast listing
  const found = listings.find((l) => l.id === id);
  if (!found) {
    return <div className="p-10">Listing not found</div>;
  }
  const listing = found as Listing;

  // Show message if the listing is private and user is not a seller
  if (listing.isPublic === false && role !== 'seller') {
    return <div className="p-10">This listing is private and cannot be viewed by buyers.</div>;
  }

  const handlePurchase = () => {
    const success = purchaseListing(listing); // ✅ Passing full listing
    if (success) {
      router.push('/purchase-success');
    }
  };

  return (
    <main className="p-10 max-w-xl mx-auto">
      <img
        src={listing.imageUrl}
        alt={listing.title}
        className="w-full h-64 object-cover rounded mb-4"
      />
      <h1 className="text-2xl font-bold">{listing.title}</h1>
      <p className="text-gray-600 mb-2">{listing.description}</p>
      <p className="text-pink-600 font-semibold mb-4">${listing.price}</p>

      {role === 'buyer' && listing.isPublic && (
        <div className="flex gap-4">
          <button
            onClick={handlePurchase}
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Buy Now
          </button>

          <button
            onClick={() => setIsMessaging(true)}
            className="bg-white border border-pink-600 text-pink-600 px-4 py-2 rounded hover:bg-pink-50"
          >
            Message Seller
          </button>
        </div>
      )}

      {isMessaging && (
        <MessageModal
          sellerName="The Seller"
          onClose={() => setIsMessaging(false)}
        />
      )}
    </main>
  );
}
