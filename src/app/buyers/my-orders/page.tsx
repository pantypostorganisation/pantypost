// src/app/buyers/my-orders/page.tsx
'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { User, Award, Gavel, MapPin, Truck, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function MyOrdersPage() {
  const { orderHistory, updateOrderAddress } = useWallet();
  const { user, users } = useListings();
  const { getRequestsForUser } = useRequests();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Accepted custom requests as "orders"
  const customOrders =
    user && user.username
      ? getRequestsForUser(user.username, 'buyer').filter((r) => r.status === 'accepted')
      : [];

  // Filter order history for current user
  const userOrders = user && user.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];

  // Separate auction orders for special display
  const auctionOrders = userOrders.filter(order => order.wasAuction);
  const directOrders = userOrders.filter(order => !order.wasAuction);

  const handleOpenAddressModal = (orderId: string) => {
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  };

  const handleConfirmAddress = (address: DeliveryAddress) => {
    if (selectedOrder) {
      updateOrderAddress(selectedOrder, address);
    }
    setAddressModalOpen(false);
    setSelectedOrder(null);
  };

  const getSelectedOrderAddress = (): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    
    const order = orderHistory.find(order => order.id === selectedOrder);
    return order?.deliveryAddress || null;
  };

  const getShippingStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Awaiting Shipment
        </span>
      );
    } else if (status === 'processing') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Package className="w-3 h-3 mr-1" />
          Preparing
        </span>
      );
    } else if (status === 'shipped') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Truck className="w-3 h-3 mr-1" />
          Shipped
        </span>
      );
    }
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {/* Auction Purchases Section */}
        {auctionOrders.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Gavel className="w-5 h-5 mr-2 text-purple-600" />
              Auction Purchases
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctionOrders.map((order) => {
                // Get seller info from users context
                const sellerUser = users?.[order.seller ?? ''];
                const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                const sellerProfilePic = sessionStorage.getItem(`profile_pic_${order.seller}`);
                const hasDeliveryAddress = !!order.deliveryAddress;

                return (
                  <div
                    key={`${order.id}-${order.date}`}
                    className="border border-purple-200 rounded-xl p-4 shadow hover:shadow-md transition flex flex-col bg-gradient-to-b from-purple-50 to-white"
                  >
                    <div className="relative">
                      <img
                        src={order.imageUrl || '/default-image.jpg'}
                        alt={order.title}
                        className="w-full h-48 object-cover mb-4 rounded"
                      />
                      <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center">
                        <Gavel className="w-3 h-3 mr-1" /> Auction
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-1">{order.title}</h2>
                    <p className="text-sm text-gray-600 mb-2 flex-grow">{order.description}</p>

                    {/* Bid information */}
                    <div className="bg-purple-50 p-3 rounded-lg mb-3 border border-purple-100">
                      <p className="text-sm font-semibold text-purple-700 mb-1">
                        Your winning bid: ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Auction ended: {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status and Shipping */}
                    <div className="flex flex-col space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Status:</span>
                        {getShippingStatusBadge(order.shippingStatus)}
                      </div>
                      
                      {hasDeliveryAddress ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Address:</span>
                          <span className="inline-flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmed
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAddressModal(order.id)}
                          className="text-sm flex items-center justify-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-lg mt-1 transition-colors w-full"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Add Delivery Address
                        </button>
                      )}
                    </div>

                    {/* Seller Info */}
                    <Link
                      href={`/sellers/${order.seller}`}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-semibold mt-auto mb-3 group/seller"
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

                    <p className="font-bold text-purple-700">
                      Total Paid: ${order.markedUpPrice?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Includes 10% platform fee
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Direct Purchases */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Direct Purchases</h2>
          {directOrders.length === 0 ? (
            <p className="text-gray-600">You haven't purchased anything directly yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {directOrders.map((order) => {
                // Get seller info from users context
                const sellerUser = users?.[order.seller ?? ''];
                const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                const sellerProfilePic = sessionStorage.getItem(`profile_pic_${order.seller}`);
                const hasDeliveryAddress = !!order.deliveryAddress;

                return (
                  <div
                    key={`${order.id}-${order.date}`}
                    className="border rounded-xl p-4 shadow hover:shadow-md transition flex flex-col"
                  >
                    <img
                      src={order.imageUrl || '/default-image.jpg'}
                      alt={order.title}
                      className="w-full h-48 object-cover mb-4 rounded"
                    />
                    <h2 className="text-xl font-semibold mb-1">{order.title}</h2>
                    <p className="text-sm text-gray-600 mb-2 flex-grow">{order.description}</p>

                    {/* Status and Shipping */}
                    <div className="flex flex-col space-y-2 mb-3">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Status:</span>
                        {getShippingStatusBadge(order.shippingStatus)}
                      </div>
                      
                      {hasDeliveryAddress ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Address:</span>
                          <span className="inline-flex items-center text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmed
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAddressModal(order.id)}
                          className="text-sm flex items-center justify-center gap-1 bg-pink-100 hover:bg-pink-200 text-pink-800 px-3 py-1.5 rounded-lg mt-1 transition-colors w-full"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Add Delivery Address
                        </button>
                      )}
                    </div>

                    {/* Seller Info */}
                    <Link
                      href={`/sellers/${order.seller}`}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-semibold mt-auto mb-3 group/seller"
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

        {/* Address Confirmation Modal */}
        <AddressConfirmationModal
          isOpen={addressModalOpen}
          onClose={() => {
            setAddressModalOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleConfirmAddress}
          existingAddress={getSelectedOrderAddress()}
          orderId={selectedOrder || ''}
        />
      </main>
    </RequireAuth>
  );
}
