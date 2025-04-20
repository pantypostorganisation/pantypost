'use client';

import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState } from 'react';

export default function SellerSubscribersPage() {
  const { user, subscriptions } = useListings();
  const [subscribers, setSubscribers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Collect all buyers subscribed to this seller
    const result: string[] = [];
    for (const buyer in subscriptions) {
      if (subscriptions[buyer].includes(user.username)) {
        result.push(buyer);
      }
    }

    setSubscribers(result);
  }, [subscriptions, user]);

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧾 Your Subscribers</h1>

        {subscribers.length === 0 ? (
          <p className="text-gray-500 italic">You don't have any subscribers yet.</p>
        ) : (
          <ul className="space-y-4">
            {subscribers.map((buyer) => {
              const pic = sessionStorage.getItem(`profile_pic_${buyer}`);
              return (
                <li
                  key={buyer}
                  className="border rounded p-4 shadow bg-white dark:bg-black flex items-center gap-4"
                >
                  {pic ? (
                    <img
                      src={pic}
                      alt={`${buyer}'s profile`}
                      className="w-14 h-14 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-300" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{buyer}</h3>
                    <p className="text-sm text-gray-500">Subscribed to you</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
