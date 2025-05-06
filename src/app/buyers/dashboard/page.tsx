'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState } from 'react';

export default function BuyerDashboardPage() {
  const { user } = useListings();
  const { orderHistory } = useWallet();
  const { getRequestsForUser } = useRequests();

  const [subscribedSellers, setSubscribedSellers] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      const subs = JSON.parse(localStorage.getItem('buyer_subscriptions') || '{}');
      setSubscribedSellers(subs[user.username] || []);
    }
  }, [user?.username]);

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

  const customRequests = getRequestsForUser(user.username, 'buyer');

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🛍️ Your Dashboard</h1>
          <Link
            href="/buyers/custom-request"
            className="text-sm bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            + Create Custom Request
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Purchase History</h2>
            <p className="mb-2">
              <Link href="/buyers/my-orders" className="text-pink-600 hover:underline">
                View all orders
              </Link>
            </p>
            <p className="text-gray-700">
              You have purchased from <span className="font-bold">{uniqueSellers.length}</span> seller{uniqueSellers.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-gray-700 mt-2">
              <Link href="/buyers/requests" className="text-orange-600 hover:underline">
                {customRequests.length} custom request{customRequests.length !== 1 ? 's' : ''} sent
              </Link>
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Active Subscriptions</h2>
            {subscribedSellers.length === 0 ? (
              <p className="text-gray-500 italic">You're not subscribed to any sellers yet.</p>
            ) : (
              <ul className="space-y-2">
                {subscribedSellers.map((seller) => {
                  const bio = typeof window !== 'undefined'
                    ? sessionStorage.getItem(`profile_bio_${seller}`) || 'No bio provided'
                    : 'No bio provided';
                  const pic = typeof window !== 'undefined'
                    ? sessionStorage.getItem(`profile_pic_${seller}`)
                    : null;
                  const price = typeof window !== 'undefined'
                    ? sessionStorage.getItem(`subscription_price_${seller}`)
                    : null;

                  return (
                    <li
                      key={seller}
                      className="flex items-center gap-4 border-b pb-2 last:border-b-0"
                    >
                      {pic ? (
                        <img
                          src={pic}
                          alt={`${seller}'s profile`}
                          className="w-10 h-10 rounded-full object-cover aspect-square"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300" />
                      )}
                      <div className="flex-1">
                        <span className="font-semibold">{seller}</span>
                        <span className="block text-xs text-gray-500">{bio}</span>
                      </div>
                      <span className="text-xs text-orange-600 font-bold">
                        ${price || 'N/A'}/mo
                      </span>
                      {/* Unsubscribe logic can be added here if needed */}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
