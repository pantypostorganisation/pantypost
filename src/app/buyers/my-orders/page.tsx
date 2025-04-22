'use client';

import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';

export default function BuyerOrdersPage() {
  const { user } = useListings();
  const { orderHistory } = useWallet();

  if (!user || user.role !== 'buyer') return null;

  // ✅ Filter orders to show only those made by the logged-in buyer
  const myOrders = orderHistory.filter(
    (order) => order.buyer === user.username
  );

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {myOrders.length === 0 ? (
          <p>You haven’t purchased anything yet.</p>
        ) : (
          <ul className="space-y-6">
            {myOrders.map((order, index) => (
              <li key={index} className="border rounded p-4 shadow">
                <img
                  src={order.imageUrl}
                  alt={order.title}
                  className="w-full h-48 object-cover rounded mb-3"
                />
                <h2 className="text-xl font-semibold">{order.title}</h2>
                <p className="text-gray-600 mb-1">{order.description}</p>
                <p className="font-bold text-pink-700">
                  ${order.markedUpPrice.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Purchased on {new Date(order.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
