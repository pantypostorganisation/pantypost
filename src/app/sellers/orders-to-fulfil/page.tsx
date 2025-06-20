// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import OrderStats from '@/components/seller/orders/OrderStats';
import OrdersSection from '@/components/seller/orders/OrdersSection';
import OrdersEmptyState from '@/components/seller/orders/OrdersEmptyState';
import AddressDisplay from '@/components/seller/orders/AddressDisplay';
import ShippingControls from '@/components/seller/orders/ShippingControls';
import { 
  Clock, 
  Package, 
  Truck, 
  ShieldAlert,
  Gavel,
  Settings,
  ShoppingBag
} from 'lucide-react';

export default function OrdersToFulfilPage() {
  const { user } = useAuth();
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
    return (
      <AddressDisplay
        order={order}
        onCopyAddress={handleCopyAddress}
        copiedText={copiedText}
        getShippingLabel={getShippingLabel}
      />
    );
  }, [handleCopyAddress, copiedText]);

  const renderShippingControls = useCallback((order: any) => {
    return (
      <ShippingControls
        order={order}
        onStatusChange={handleStatusChange}
      />
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

            {/* Order Statistics */}
            <OrderStats
              auctionCount={auctionOrders.length}
              customRequestCount={customRequestOrders.length}
              standardCount={directOrders.length}
            />

            {/* Auction Sales */}
            <OrdersSection
              title="Auction Sales"
              icon={Gavel}
              iconColor="from-purple-600 to-purple-500"
              orders={auctionOrders}
              type="auction"
              expandedOrder={expandedOrder}
              onToggleExpand={toggleExpand}
              renderAddressBlock={renderAddressBlock}
              renderShippingControls={renderShippingControls}
              getShippingStatusBadge={getShippingStatusBadge}
            />

            {/* Custom Request Orders */}
            <OrdersSection
              title="Custom Request Orders"
              icon={Settings}
              iconColor="from-blue-600 to-cyan-500"
              orders={customRequestOrders}
              type="custom"
              expandedOrder={expandedOrder}
              onToggleExpand={toggleExpand}
              renderAddressBlock={renderAddressBlock}
              renderShippingControls={renderShippingControls}
              getShippingStatusBadge={getShippingStatusBadge}
            />

            {/* Direct Sales */}
            <OrdersSection
              title="Direct Sales"
              icon={ShoppingBag}
              iconColor="from-[#ff950e] to-[#e0850d]"
              orders={directOrders}
              type="direct"
              expandedOrder={expandedOrder}
              onToggleExpand={toggleExpand}
              renderAddressBlock={renderAddressBlock}
              renderShippingControls={renderShippingControls}
              getShippingStatusBadge={getShippingStatusBadge}
              showEmptyState={true}
            />

            {/* Summary when no orders */}
            {userOrders.length === 0 && <OrdersEmptyState />}

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
