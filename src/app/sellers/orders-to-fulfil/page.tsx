'use client';

import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState } from 'react';

export default function OrdersToFulfilPage() {
  const { user } = useListings();
  const { getRequestsForUser } = useRequests();
  const { orderHistory } = useWallet();

  const [orders, setOrders] = useState<any[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // 1. Get all accepted custom requests for this seller
    const requests = getRequestsForUser(user.username, 'seller');
    const acceptedCustoms = requests.filter((req) => req.status === 'accepted');

    setCustomOrders(acceptedCustoms);

    // 2. Get all direct sales for this seller
    const sales = orderHistory.filter((order) => order.seller === user.username);

    setOrders(sales);
  }, [user, getRequestsForUser, orderHistory]);

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📦 Orders to Fulfil</h1>

        {/* Direct Sales */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Direct Sales</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500 italic">No direct sales to fulfill yet.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li
                  key={order.id + order.date}
                  className="border rounded-lg p-4 bg-white flex flex-col md:flex-row gap-4 items-center"
                >
                  <img
                    src={order.imageUrl}
                    alt={order.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{order.title}</h3>
                    <p className="text-sm text-gray-600">Buyer: {order.buyer}</p>
                    <p className="text-sm text-gray-600">Sold on: {new Date(order.date).toLocaleDateString()}</p>
                    <p className="text-pink-700 font-bold mt-1">${order.markedUpPrice?.toFixed(2) ?? order.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-semibold">
                      Pending Fulfillment
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Accepted Custom Requests */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Accepted Custom Requests</h2>
          {customOrders.length === 0 ? (
            <p className="text-gray-500 italic">No accepted custom requests to fulfill yet.</p>
          ) : (
            <ul className="space-y-4">
              {customOrders.map((req) => (
                <li
                  key={req.id}
                  className="border rounded-lg p-4 bg-white flex flex-col md:flex-row gap-4 items-center"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{req.title}</h3>
                    <p className="text-sm text-gray-600">Buyer: {req.buyer}</p>
                    <p className="text-sm text-gray-600">Requested: {new Date(req.date).toLocaleDateString()}</p>
                    <p className="text-pink-700 font-bold mt-1">${req.price.toFixed(2)}</p>
                    {req.tags && req.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {req.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-700 mt-2">{req.description}</p>
                  </div>
                  <div>
                    <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-semibold">
                      Pending Fulfillment
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
