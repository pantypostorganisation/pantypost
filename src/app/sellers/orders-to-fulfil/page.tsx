// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import BanCheck from '@/components/BanCheck';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { 
  User, 
  Award, 
  Gavel, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  Package, 
  AlertTriangle, 
  Copy, 
  Check,
  FileText,
  ShieldAlert,
  Box,
  MessageCircle,
  Clock,
  Star,
  Settings,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  Mail
} from 'lucide-react';

export default function OrdersToFulfilPage() {
  const { user } = useListings();
  const { orderHistory, updateOrderAddress, updateShippingStatus } = useWallet();

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Memoize filtered orders for performance
  const { userOrders, auctionOrders, customRequestOrders, directOrders } = useMemo(() => {
    if (!user?.username) {
      return { userOrders: [], auctionOrders: [], customRequestOrders: [], directOrders: [] };
    }

    const userOrders = orderHistory.filter(order => order.seller === user.username);
    const auctionOrders = userOrders.filter(order => order.wasAuction);
    const customRequestOrders = userOrders.filter(order => order.isCustomRequest);
    const directOrders = userOrders.filter(order => !order.wasAuction && !order.isCustomRequest);

    return { userOrders, auctionOrders, customRequestOrders, directOrders };
  }, [user?.username, orderHistory]);

  const handleOpenAddressModal = useCallback((orderId: string) => {
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  }, []);

  const handleConfirmAddress = useCallback((address: DeliveryAddress) => {
    if (selectedOrder) {
      updateOrderAddress(selectedOrder, address);
    }
    setAddressModalOpen(false);
    setSelectedOrder(null);
  }, [selectedOrder, updateOrderAddress]);

  const getSelectedOrderAddress = useCallback((): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    
    const order = orderHistory.find(order => order.id === selectedOrder);
    return order?.deliveryAddress || null;
  }, [selectedOrder, orderHistory]);

  const getShippingStatusBadge = useCallback((status?: string) => {
    if (!status || status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Awaiting Shipment
        </span>
      );
    } else if (status === 'processing') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Package className="w-3 h-3 mr-1" />
          Preparing
        </span>
      );
    } else if (status === 'shipped') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
          <Truck className="w-3 h-3 mr-1" />
          Shipped
        </span>
      );
    }
  }, []);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  }, []);

  const handleCopyAddress = useCallback(async (address: DeliveryAddress) => {
    const formattedAddress = formatAddressForCopy(address);
    
    try {
      await navigator.clipboard.writeText(formattedAddress);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 2000);
    }
  }, []);

  const formatAddressForCopy = useCallback((address: DeliveryAddress): string => {
    const lines = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);
    
    return lines.join('\n');
  }, []);

  const handleStatusChange = useCallback((orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    updateShippingStatus(orderId, status);
  }, [updateShippingStatus]);

  const renderAddressBlock = useCallback((order: any) => {
    if (!order.deliveryAddress) {
      return (
        <div className="mt-4 py-4 px-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-yellow-200 font-semibold text-base mb-2">Waiting for delivery address</p>
            <p className="text-yellow-300/80 text-sm mb-3">
              The buyer hasn't provided their shipping address yet. You can message them to request it.
            </p>
            <Link
              href={`/sellers/messages?thread=${order.buyer}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff950e] to-[#e0850d] hover:from-[#e0850d] hover:to-[#ff950e] text-black font-bold px-4 py-2 rounded-lg transition-all text-sm shadow-lg hover:shadow-[#ff950e]/25"
            >
              <MessageCircle className="w-4 h-4" />
              Message {order.buyer}
            </Link>
          </div>
        </div>
      );
    }

    const address = order.deliveryAddress;
    return (
      <div className="mt-4 border border-gray-700 rounded-xl overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="bg-gradient-to-r from-[#ff950e]/20 to-[#e0850d]/20 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-[#ff950e] mr-2" />
            <h4 className="font-semibold text-white text-base">📦 Shipping Address</h4>
          </div>
          <button 
            onClick={() => handleCopyAddress(address)}
            className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] hover:from-[#e0850d] hover:to-[#ff950e] text-black text-sm font-bold flex items-center px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-[#ff950e]/25"
          >
            {copiedText === 'address' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </>
            )}
          </button>
        </div>
        <div className="p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30">
          <div className="font-bold text-lg text-white mb-1">{address.fullName}</div>
          <div className="text-gray-300 text-base leading-relaxed">
            <div>{address.addressLine1}</div>
            {address.addressLine2 && <div>{address.addressLine2}</div>}
            <div>{address.city}, {address.state} {address.postalCode}</div>
            <div className="font-medium">{address.country}</div>
          </div>
          {address.specialInstructions && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="text-sm text-[#ff950e] font-semibold mb-2">Special Instructions:</div>
              <p className="text-gray-300 bg-black/20 p-3 rounded-lg border border-gray-600">{address.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [handleCopyAddress, copiedText]);

  const renderShippingControls = useCallback((order: any) => {
    if (!order.deliveryAddress) return null;
    
    return (
      <div className="mt-6 border-t border-gray-700 pt-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h4 className="font-semibold text-white text-lg flex items-center">
            <Truck className="w-5 h-5 mr-2 text-[#ff950e]" />
            Update Shipping Status
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleStatusChange(order.id, 'pending')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                order.shippingStatus === 'pending' || !order.shippingStatus
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              ⏳ Pending
            </button>
            <button
              onClick={() => handleStatusChange(order.id, 'processing')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                order.shippingStatus === 'processing'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              📦 Processing
            </button>
            <button
              onClick={() => handleStatusChange(order.id, 'shipped')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                order.shippingStatus === 'shipped'
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
              }`}
            >
              🚚 Shipped
            </button>
          </div>
        </div>
      </div>
    );
  }, [handleStatusChange]);

  // Function to extract the shipping label text that could be printed
  const getShippingLabel = useCallback((order: any): string => {
    if (!order.deliveryAddress) return '';

    const address = order.deliveryAddress;
    const lines = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);

    return lines.join('\n');
  }, []);

  const renderOrderCard = useCallback((order: any, type: 'auction' | 'direct' | 'custom') => {
    const isAuction = type === 'auction';
    const isCustom = type === 'custom';
    
    let borderStyle = 'border-gray-700 hover:border-[#ff950e]/50';
    let gradientStyle = 'from-gray-900/50 via-black/30 to-gray-800/50';
    let badgeContent = null;
    
    if (isAuction) {
      borderStyle = 'border-purple-500/30 hover:border-purple-400/50';
      gradientStyle = 'from-purple-900/10 via-gray-900/50 to-blue-900/10';
      badgeContent = (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
          <Gavel className="w-3 h-3 mr-1" />
          Auction
        </span>
      );
    } else if (isCustom) {
      borderStyle = 'border-blue-500/30 hover:border-blue-400/50';
      gradientStyle = 'from-blue-900/10 via-gray-900/50 to-cyan-900/10';
      badgeContent = (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
          <Settings className="w-3 h-3 mr-1" />
          Custom
        </span>
      );
    }
    
    return (
      <li
        key={order.id + order.date}
        className={`relative border rounded-2xl bg-gradient-to-br overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${gradientStyle} ${borderStyle}`}
      >
        {/* Order Header */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Product Image - Hide for custom requests */}
            {!isCustom && (
              <div className="relative">
                <img
                  src={order.imageUrl || '/default-image.jpg'}
                  alt={order.title}
                  className="w-24 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-image.jpg';
                  }}
                />
                {badgeContent}
              </div>
            )}

            {/* For custom requests, show badge without image */}
            {isCustom && badgeContent && (
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border-2 border-blue-500/30 flex items-center justify-center">
                <Settings className="w-8 h-8 text-blue-400" />
                {badgeContent}
              </div>
            )}

            {/* Order Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-xl text-white truncate">{order.title}</h3>
                {isAuction && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                {isCustom && <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Buyer:</span>
                  <span className="font-semibold text-white">{order.buyer}</span>
                  <Link
                    href={`/sellers/messages?thread=${order.buyer}`}
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-lg hover:shadow-blue-500/25"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Message
                  </Link>
                </div>
              </div>
              
              <div className="text-sm text-gray-400 mb-4">
                {isAuction && 'Won on: '}
                {isCustom && 'Requested on: '}
                {!isAuction && !isCustom && 'Sold on: '} 
                <span className="text-gray-300 font-medium">{new Date(order.date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {isAuction && (
                  <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-700/50">
                    <span className="text-purple-300 text-sm">Winning bid:</span>
                    <span className="text-purple-200 font-bold text-lg ml-2">
                      ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {isCustom && (
                  <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700/50">
                    <span className="text-blue-300 text-sm">Agreed price:</span>
                    <span className="text-blue-200 font-bold text-lg ml-2">
                      ${order.price.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {!isAuction && !isCustom && (
                  <div className="bg-[#ff950e]/10 px-4 py-2 rounded-lg border border-[#ff950e]/30">
                    <span className="text-[#ff950e] text-sm">Listed price:</span>
                    <span className="text-[#ff950e] font-bold text-lg ml-2">
                      ${order.price.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Show custom request details */}
              {isCustom && order.originalRequestId && (
                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                  <div className="text-blue-300 text-sm font-medium mb-1">Custom Request Details:</div>
                  <div className="text-blue-200 text-sm">{order.description}</div>
                  {order.tags && order.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {order.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-blue-800/30 text-blue-200 text-xs px-2 py-0.5 rounded border border-blue-600/50"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status & Actions */}
            <div className="flex flex-col items-end gap-4">
              {getShippingStatusBadge(order.shippingStatus)}
              
              {order.deliveryAddress ? (
                <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded-lg border border-green-700/50">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-sm font-medium">Address provided</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-2 rounded-lg border border-yellow-700/50">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">No address yet</span>
                </div>
              )}
              
              <button
                className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-all text-sm ${
                  isAuction 
                    ? 'text-purple-300 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 hover:border-purple-600' 
                    : isCustom
                    ? 'text-blue-300 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 hover:border-blue-600'
                    : 'text-[#ff950e] bg-[#ff950e]/10 hover:bg-[#ff950e]/20 border border-[#ff950e]/30 hover:border-[#ff950e]/50'
                }`}
                onClick={() => toggleExpand(order.id)}
              >
                {expandedOrder === order.id ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expandedOrder === order.id && (
          <div className="border-t border-gray-700 bg-black/20 p-6">
            {renderAddressBlock(order)}
            {renderShippingControls(order)}

            {order.deliveryAddress && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="font-semibold text-white text-lg flex items-center mb-4">
                  <FileText className="w-5 h-5 mr-2 text-[#ff950e]" />
                  Shipping Label
                </h4>
                
                {/* Enhanced Warning */}
                <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-2 border-red-500 rounded-xl p-4 mb-4 flex items-start">
                  <ShieldAlert className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-red-200 font-bold text-sm uppercase tracking-wide mb-2">
                      PRIVACY WARNING - NO RETURN ADDRESS
                    </p>
                    <p className="text-red-300 text-sm">
                      For your safety and privacy, <strong>never include your personal address</strong> on any package. 
                      Use a PO Box or shipping service if a return address is required.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600 font-mono text-base text-gray-100 whitespace-pre-line shadow-inner">
                  {getShippingLabel(order)}
                </div>
                <p className="text-sm text-gray-400 mt-3 flex items-center">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy the text above to write on your shipping label
                </p>
              </div>
            )}
          </div>
        )}
      </li>
    );
  }, [expandedOrder, getShippingStatusBadge, toggleExpand, renderAddressBlock, renderShippingControls, getShippingLabel]);

  if (!user) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center mb-4">
                📦 Orders to Fulfil
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl">
                Manage your pending orders, update shipping status, and access buyer contact information.
              </p>
            </div>

            {/* Auction Sales */}
            {auctionOrders.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-2 rounded-lg mr-3 shadow-lg">
                    <Gavel className="w-6 h-6 text-white" />
                  </div>
                  Auction Sales ({auctionOrders.length})
                </h2>
                <ul className="space-y-6">
                  {auctionOrders.map((order) => renderOrderCard(order, 'auction'))}
                </ul>
              </section>
            )}

            {/* Custom Request Orders */}
            {customRequestOrders.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg mr-3 shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  Custom Request Orders ({customRequestOrders.length})
                </h2>
                <ul className="space-y-6">
                  {customRequestOrders.map((order) => renderOrderCard(order, 'custom'))}
                </ul>
              </section>
            )}

            {/* Direct Sales */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                <div className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] p-2 rounded-lg mr-3 shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-black" />
                </div>
                Direct Sales ({directOrders.length})
              </h2>
              {directOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
                  <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-xl mb-2">No direct sales to fulfill yet</p>
                  <p className="text-gray-500">Orders will appear here when buyers purchase your items</p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {directOrders.map((order) => renderOrderCard(order, 'direct'))}
                </ul>
              )}
            </section>

            {/* Summary when no orders */}
            {userOrders.length === 0 && (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
                <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                <h3 className="text-gray-400 text-2xl mb-4">No orders to fulfill yet</h3>
                <p className="text-gray-500 text-lg mb-6">
                  Orders from direct sales, auctions, and custom requests will appear here once customers make purchases.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/sellers/my-listings"
                    className="inline-flex items-center gap-2 bg-[#ff950e] hover:bg-[#e88800] text-black font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-[#ff950e]/25"
                  >
                    <Package className="w-5 h-5" />
                    Manage Listings
                  </Link>
                  <Link
                    href="/sellers/messages"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Check Messages
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
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
