// src/app/buyers/my-orders/page.tsx
'use client';

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { 
  User, 
  Award, 
  Gavel, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Star,
  MessageCircle,
  DollarSign
} from 'lucide-react';

export default function MyOrdersPage() {
  const { orderHistory, updateOrderAddress } = useWallet();
  const { user, users } = useListings();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  // Filter order history for current user
  const userOrders = user && user.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];

  // Separate orders by type
  const auctionOrders = userOrders.filter(order => order.wasAuction);
  const customRequestOrders = userOrders.filter(order => order.isCustomRequest);
  const directOrders = userOrders.filter(order => !order.wasAuction && !order.isCustomRequest);

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

  const renderOrderCard = (order: any, type: 'auction' | 'direct' | 'custom') => {
    const isAuction = type === 'auction';
    const isCustom = type === 'custom';
    
    // Get seller info from users context
    const sellerUser = users?.[order.seller ?? ''];
    const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
    const sellerProfilePic = sessionStorage.getItem(`profile_pic_${order.seller}`);
    const hasDeliveryAddress = !!order.deliveryAddress;
    
    let borderStyle = 'border-gray-200';
    let gradientStyle = 'from-white to-gray-50';
    let badgeContent = null;
    let priceStyle = 'text-pink-700';
    
    if (isAuction) {
      borderStyle = 'border-purple-200';
      gradientStyle = 'from-purple-50 to-white';
      priceStyle = 'text-purple-700';
      badgeContent = (
        <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center">
          <Gavel className="w-3 h-3 mr-1" /> Auction
        </span>
      );
    } else if (isCustom) {
      borderStyle = 'border-blue-200';
      gradientStyle = 'from-blue-50 to-white';
      priceStyle = 'text-blue-700';
      badgeContent = (
        <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center">
          <Settings className="w-3 h-3 mr-1" /> Custom
        </span>
      );
    }

    return (
      <div
        key={`${order.id}-${order.date}`}
        className={`border rounded-xl p-4 shadow hover:shadow-md transition flex flex-col bg-gradient-to-b ${gradientStyle} ${borderStyle}`}
      >
        <div className="relative">
          <img
            src={order.imageUrl || '/default-image.jpg'}
            alt={order.title}
            className="w-full h-48 object-cover mb-4 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-image.jpg';
            }}
          />
          {badgeContent}
        </div>
        
        <h2 className="text-xl font-semibold mb-1">{order.title}</h2>
        <p className="text-sm text-gray-600 mb-2 flex-grow">{order.description}</p>

        {/* Order Type Specific Information */}
        {isAuction && (
          <div className="bg-purple-50 p-3 rounded-lg mb-3 border border-purple-100">
            <p className="text-sm font-semibold text-purple-700 mb-1">
              Your winning bid: ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Auction ended: {new Date(order.date).toLocaleDateString()}
            </p>
          </div>
        )}

        {isCustom && (
          <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">Custom Request Order</p>
            </div>
            <p className="text-xs text-gray-500">
              Requested: {new Date(order.date).toLocaleDateString()}
            </p>
            {order.originalRequestId && (
              <p className="text-xs text-blue-600 mt-1">
                Request ID: {order.originalRequestId.slice(0, 8)}...
              </p>
            )}
            {order.tags && order.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {order.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

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
              className={`text-sm flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg mt-1 transition-colors w-full ${
                isAuction ? 'bg-purple-100 hover:bg-purple-200 text-purple-800' :
                isCustom ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' :
                'bg-pink-100 hover:bg-pink-200 text-pink-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Add Delivery Address
            </button>
          )}
        </div>

        {/* FIXED: Seller Info - Separated the two links to avoid nesting */}
        <div className="flex items-center justify-between gap-2 mt-auto mb-3">
          {/* Seller Profile Link */}
          <Link
            href={`/sellers/${order.seller}`}
            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 font-semibold group/seller flex-1"
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
            <span>{order.seller}</span>
            
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
          
          {/* Message seller button - Separate link */}
          <Link
            href={`/buyers/messages?thread=${order.seller}`}
            className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-500 text-white font-bold px-2 py-1 rounded text-xs transition-all shadow-sm"
          >
            <MessageCircle className="w-3 h-3" />
            Message
          </Link>
        </div>

        {/* Price Information */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Total Paid:
            </span>
            <p className={`font-bold ${priceStyle}`}>
              ${order.markedUpPrice?.toFixed(2) ?? order.price.toFixed(2)}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            Includes 10% platform fee
          </p>
          
          {/* Show tier credit if applicable */}
          {order.tierCreditAmount && order.tierCreditAmount > 0 && (
            <p className="text-xs text-green-600 mt-1 text-right">
              Seller earned ${order.tierCreditAmount.toFixed(2)} tier bonus
            </p>
          )}
        </div>
      </div>
    );
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
              Auction Purchases ({auctionOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctionOrders.map((order) => renderOrderCard(order, 'auction'))}
            </div>
          </section>
        )}

        {/* Custom Request Orders Section */}
        {customRequestOrders.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Custom Request Orders ({customRequestOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {customRequestOrders.map((order) => renderOrderCard(order, 'custom'))}
            </div>
          </section>
        )}

        {/* Direct Purchases */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Direct Purchases ({directOrders.length})</h2>
          {directOrders.length === 0 ? (
            <p className="text-gray-600">You haven't purchased anything directly yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {directOrders.map((order) => renderOrderCard(order, 'direct'))}
            </div>
          )}
        </section>

        {/* No orders message */}
        {userOrders.length === 0 && (
          <div className="text-center py-16 bg-gray-100 rounded-xl">
            <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-4">No orders yet</h3>
            <p className="text-gray-500 mb-6">
              Your purchases from direct sales, auctions, and custom requests will appear here.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
              >
                <Package className="w-5 h-5" />
                Browse Listings
              </Link>
              <Link
                href="/buyers/messages"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Send Custom Requests
              </Link>
            </div>
          </div>
        )}

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
