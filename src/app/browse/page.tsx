'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';

export default function BrowsePage() {
  const { listings, removeListing, user, isSubscribed } = useListings();
  const { purchaseListing } = useWallet();

  const handlePurchase = (listing: any) => {
    if (!user) return;

    const success = purchaseListing(listing, user.username);

    if (success) {
      removeListing(listing.id);
      alert('Purchase successful! 🎉');
    } else {
      alert('Insufficient balance. Please top up your wallet.');
    }
  };

  // ✅ Filter listings: Only show premium if buyer is subscribed to the seller
  const visibleListings = listings.filter((listing) => {
    if (!listing.isPremium) return true;
    return user?.username && isSubscribed(user.username, listing.seller);
  });

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>

        {visibleListings.length === 0 ? (
          <p className="text-gray-500 italic">No listings available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleListings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-xl p-4 shadow hover:shadow-lg transition flex flex-col justify-between bg-white dark:bg-black"
              >
                <Link href={`/browse/${listing.id}`}>
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-48 object-cover mb-4 rounded"
                  />
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {listing.title}
                    {listing.isPremium && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 mb-2">
                    {listing.description.length > 80
                      ? listing.description.slice(0, 80) + '...'
                      : listing.description}
                  </p>
                  <p className="font-bold text-pink-700">
                    ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
                  </p>
                </Link>

                {user?.role === 'buyer' && (
                  <button
                    onClick={() => handlePurchase(listing)}
                    className="mt-4 bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
