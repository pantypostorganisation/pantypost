'use client';

import React from 'react'; // ✅ Import React at the top
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function MyOrdersPage() {
  const { buyerOrders } = useListings();

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {buyerOrders.length === 0 ? (
          <p>You haven’t purchased anything yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {buyerOrders.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-xl p-4 shadow hover:shadow-md transition"
              >
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <h2 className="text-xl font-semibold">{listing.title}</h2>
                <p className="text-sm text-gray-600 mb-2">{listing.description}</p>
                <p className="font-bold text-pink-700">${listing.price}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
