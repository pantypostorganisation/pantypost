'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';

export default function BrowsePage() {
  const { listings, role } = useListings();

  // Filter listings based on role
  const filteredListings = role === 'buyer'
    ? listings.filter((listing) => listing.isPublic) // Buyers only see public listings
    : listings; // Sellers can see both public and private listings

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
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
            <p className="text-sm text-gray-600 mb-2">{listing.description}</p>
            <p className="font-bold text-pink-700">${listing.price}</p>
            <p className="text-xs">{listing.isPublic ? 'Public Listing' : 'Private Listing'}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
