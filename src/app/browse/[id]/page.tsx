'use client';

import { useParams, useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { listings, purchaseListing } = useListings();

  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return <div className="p-10">Listing not found</div>;
  }

  const handlePurchase = () => {
    const success = purchaseListing(listing.price);
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
      <button
        onClick={handlePurchase}
        className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
      >
        Buy Now
      </button>
    </main>
  );
}
