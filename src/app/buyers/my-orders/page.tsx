'use client';

import React from 'react'; // ✅ Import React at the top
import { useWallet } from '@/context/WalletContext'; // Import the WalletContext to access order history
import RequireAuth from '@/components/RequireAuth';

export default function MyOrdersPage() {
  const { orderHistory } = useWallet(); // Get the order history from the wallet context

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
                key={order.id}
                className="border rounded-xl p-4 shadow hover:shadow-md transition"
              >
                <img
                  src={order.imageUrl} // Make sure imageUrl is part of the order
                  alt={order.title}
                  className="w-full h-48 object-cover mb-4 rounded"
                />
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
