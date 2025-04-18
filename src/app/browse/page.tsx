'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function BrowsePage() {
  const { listings, role } = useListings();

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="border rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col justify-between bg-white dark:bg-black"
            >
              <Link
                href={`/browse/${listing.id}`}
                className="no-underline hover:no-underline"
              >
                <div>
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
                </div>
              </Link>

              {role === 'buyer' && (
                <Link href={`/browse/${listing.id}`}>
                  <button className="mt-4 w-full bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">
                    View Listing
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </main>
    </RequireAuth>
  );
}
