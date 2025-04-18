'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import Link from 'next/link';

export default function BuyerDashboardPage() {
  const { user } = useListings();
  const { orderHistory } = useWallet();
  const { hasReviewed } = useReviews();

  if (!user || user.role !== 'buyer') {
    return (
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🚫 Access Denied</h1>
        <p className="text-gray-600">Only buyers can view this page.</p>
      </main>
    );
  }

  // ✅ Only include sellers this buyer has actually purchased from
  const uniqueSellers = Array.from(
    new Set(
      orderHistory
        .filter((order) => order.buyer === user.username)
        .map((order) => order.seller)
    )
  );

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛍️ Your Purchase History</h1>

      {uniqueSellers.length === 0 ? (
        <p className="text-gray-500 italic">You haven't purchased from any sellers yet.</p>
      ) : (
        <ul className="space-y-4">
          {uniqueSellers.map((seller) => {
            const reviewed = hasReviewed(seller, user.username);
            return (
              <li
                key={seller}
                className="border rounded p-4 shadow bg-white dark:bg-black"
              >
                <h2 className="text-lg font-semibold mb-1">{seller}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {reviewed
                    ? '✅ You left a review.'
                    : '📝 You haven\'t reviewed this seller yet.'}
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/sellers/${seller}`}
                    className="text-sm bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    View Profile
                  </Link>
                  {!reviewed && (
                    <Link
                      href={`/sellers/${seller}#review-form`}
                      className="text-sm bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Leave a Review
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
