'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link'; // Import Link
import { User } from 'lucide-react'; // Import User icon

export default function MyOrdersPage() {
  const { orderHistory } = useWallet();
  // Added 'users' to the useListings hook
  const { user, users } = useListings();
  const { getRequestsForUser } = useRequests();

  // Accepted custom requests as "orders"
  const customOrders =
    user && user.username
      ? getRequestsForUser(user.username, 'buyer').filter((r) => r.status === 'accepted')
      : [];

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {/* Direct Purchases */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Direct Purchases</h2>
          {orderHistory.length === 0 ? (
            <p className="text-gray-600">You haven’t purchased anything yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orderHistory.map((order) => {
                // Get seller info from users context
                const sellerUser = users?.[order.seller ?? ''];
                const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                const sellerProfilePic = sellerUser?.profilePic; // Assuming profilePic is available on user object

                return (
                  <div
                    key={`${order.id}-${order.date}`}
                    className="border rounded-xl p-4 shadow hover:shadow-md transition flex flex-col" // Added flex-col
                  >
                    <img
                      src={order.imageUrl || '/default-image.jpg'} // Existing logic to display image
                      alt={order.title}
                      className="w-full h-48 object-cover mb-4 rounded"
                    />
                    <h2 className="text-xl font-semibold mb-1">{order.title}</h2>
                    <p className="text-sm text-gray-600 mb-2 flex-grow">{order.description}</p> {/* Added flex-grow */}

                    {/* Seller Info */}
                    <Link
                      href={`/sellers/${order.seller}`}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-semibold mt-auto mb-3 group/seller" // Added group/seller
                    >
                      {sellerProfilePic ? (
                        <span className="relative group-hover/seller:ring-2 group-hover/seller:ring-gray-400 rounded-full transition">
                          <img
                            src={sellerProfilePic}
                            alt={order.seller}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300"
                          />
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                          {order.seller ? order.seller.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                      {order.seller}
                      {/* Verified Badge */}
                      {isSellerVerified && (
                        <div className="relative">
                          <img
                            src="/verification_badge.png"
                            alt="Verified"
                            className="w-4 h-4"
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover/seller:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                            Verified Seller
                          </div>
                        </div>
                      )}
                    </Link>

                    <p className="font-bold text-pink-700 mb-1">
                      You paid: ${order.markedUpPrice?.toFixed(2) ?? order.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Purchased on: {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Accepted Custom Orders */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Accepted Custom Orders</h2>
          {customOrders.length === 0 ? (
            <p className="text-gray-500 italic">No accepted custom orders yet.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {customOrders.map((order) => (
                <li key={order.id} className="border rounded-xl p-4 shadow bg-white">
                  <h3 className="font-semibold">{order.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                  <p className="font-bold text-pink-700 mb-1">
                    You pay: ${order.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Accepted on: {new Date(order.date).toLocaleDateString()}
                  </p>
                  {order.tags && order.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {order.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2 font-semibold">Status: Accepted</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
