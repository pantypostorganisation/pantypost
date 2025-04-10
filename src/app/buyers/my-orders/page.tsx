'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext'; // Import the WalletContext
import RequireAuth from '@/components/RequireAuth'; // Protect page for buyers only

export default function MyOrdersPage() {
  const { orderHistory } = useWallet(); // Get the order history from WalletContext

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orderHistory.length === 0 ? (
          <p>You haven’t purchased anything yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {orderHistory.map((order) => (
              <div
                key={`${order.id}-${order.date}`} // Ensure the key is unique by combining order.id and order.date
                className="border rounded-xl p-4 shadow hover:shadow-md transition"
              >
                <img
                  src={order.imageUrl || '/default-image.jpg'} // Placeholder if imageUrl is missing
                  alt={order.title}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                <h2 className="text-xl font-semibold">{order.title}</h2>
                <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                <p className="font-bold text-pink-700">${order.price}</p>
                <p className="text-xs text-gray-500">Purchased on: {new Date(order.date).toLocaleDateString()}</p> {/* Display purchase date */}
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
