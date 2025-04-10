'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';

export default function BrowsePage() {
  const { listings } = useListings();

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/browse/${listing.id}`}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col justify-between bg-white dark:bg-black"
          >
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-48 object-cover mb-4 rounded"
            />
            <h2 className="text-xl font-semibold">{listing.title}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {listing.description.length > 80
                ? listing.description.slice(0, 80) + '...'
                : listing.description}
            </p>
            <p className="font-bold text-pink-700">
              ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
