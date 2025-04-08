'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext'; // Import the WalletContext to access order history
import RequireAuth from '@/components/RequireAuth'; // Ensure only buyers can access this page

export default function MyOrdersPage() {
  const { orderHistory } = useWallet(); // Get the order history from context

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {/* Display message if no orders */}
        {orderHistory.length === 0 ? (
          <p>You haven’t purchased anything yet.</p>
        ) : (
          // Display orders if they exist
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orderHistory.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-4 shadow hover:shadow-md transition"
              >
                {/* Order Image */}
                <img
                  src={order.imageUrl} // Display the image from the order
                  alt={order.title}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
                {/* Order Details */}
                <h2 className="text-xl font-semibold">{order.title}</h2>
                <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                <p className="font-bold text-pink-700">${order.price}</p>
                <p className="text-xs text-gray-500">Purchased on: {new Date(order.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
