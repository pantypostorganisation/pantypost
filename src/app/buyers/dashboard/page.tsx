'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import Link from 'next/link';
import { useState } from 'react';

export default function BuyerDashboardPage() {
  const { user, subscriptions, unsubscribeFromSeller, addSellerNotification } = useListings();
  const { orderHistory } = useWallet();
  const { hasReviewed } = useReviews();
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!user || user.role !== 'buyer') {
    return (
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🚫 Access Denied</h1>
        <p className="text-gray-600">Only buyers can view this page.</p>
      </main>
    );
  }

  const uniqueSellers = Array.from(
    new Set(
      orderHistory
        .filter((order) => order.buyer === user.username)
        .map((order) => order.seller)
    )
  );

  const subscribedSellers = subscriptions[user.username] || [];

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛍️ Your Purchase History</h1>

      {uniqueSellers.length === 0 ? (
        <p className="text-gray-500 italic">You haven't purchased from any sellers yet.</p>
      ) : (
        <ul className="space-y-4 mb-10">
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

      <h2 className="text-2xl font-bold mb-4">💖 Active Subscriptions</h2>

      {subscribedSellers.length === 0 ? (
        <p className="text-gray-500 italic">You're not subscribed to any sellers yet.</p>
      ) : (
        <ul className="space-y-4">
          {subscribedSellers.map((seller) => {
            const bio = sessionStorage.getItem(`profile_bio_${seller}`) || 'No bio provided';
            const pic = sessionStorage.getItem(`profile_pic_${seller}`);
            const price = sessionStorage.getItem(`subscription_price_${seller}`);

            return (
              <li
                key={seller}
                className="border rounded p-4 shadow bg-white dark:bg-black flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {pic ? (
                    <img
                      src={pic}
                      alt={`${seller}'s profile`}
                      className="w-16 h-16 rounded-full object-cover aspect-square"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{seller}</h3>
                    <p className="text-sm text-gray-500">💵 ${price}/month</p>
                  </div>
                </div>
                {confirming === seller ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        unsubscribeFromSeller(user.username, seller);
                        addSellerNotification(seller, `❌ ${user.username} unsubscribed from you.`);
                        setConfirming(null);
                      }}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="text-sm bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming(seller)}
                    className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Unsubscribe
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
