// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';

// Seller orders UI
import OrderStats from '@/components/seller/orders/OrderStats';
import OrdersSection from '@/components/seller/orders/OrdersSection';
import AddressDisplay from '@/components/seller/orders/AddressDisplay';
import ShippingControls from '@/components/seller/orders/ShippingControls';

import type { DeliveryAddress, Order } from '@/types/order';
import { Clock, Package, Truck, Gavel, Settings, ShoppingBag } from 'lucide-react';

export default function OrdersToFulfilPage() {
  const { user, apiClient } = useAuth();
  const { updateOrderAddress, updateShippingStatus } = useWallet();

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [sellerOrderHistory, setSellerOrderHistory] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch seller orders directly from backend to ensure this page shows orders to fulfil
  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        if (!user?.username) return;
        const response = await apiClient.get<any>(`/orders?seller=${encodeURIComponent(user.username)}`);
        if (response?.success && Array.isArray(response.data)) {
          setSellerOrderHistory(response.data);
        }
      } catch (err) {
        console.error('[OrdersToFulfilPage] Failed to fetch seller orders:', err);
      }
    };
    fetchSellerOrders();
  }, [user?.username, apiClient]);

  // Filter & group for UI
  const { userOrders, auctionOrders, customRequestOrders, directOrders } = useMemo(() => {
    if (!user?.username) {
      return { userOrders: [], auctionOrders: [], customRequestOrders: [], directOrders: [] };
    }
    const history = Array.isArray(sellerOrderHistory) ? sellerOrderHistory : [];
    const userOrders = history.filter((order) => order.seller === user.username);
    const auctionOrders = userOrders.filter((order) => !!order.wasAuction);
    const customRequestOrders = userOrders.filter((order) => !!order.isCustomRequest);
    const directOrders = userOrders.filter((order) => !order.wasAuction && !order.isCustomRequest);
    return { userOrders, auctionOrders, customRequestOrders, directOrders };
  }, [user?.username, sellerOrderHistory]);

  // OrderStats in your repo expects these three counts
  const auctionCount = auctionOrders.length;
  const customRequestCount = customRequestOrders.length;
  const standardCount = directOrders.length;

  // Status badge renderer (OrdersSection requires this signature)
  const getShippingStatusBadge = useCallback((status?: string) => {
    if (!status || status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    } else if (status === 'processing') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Package className="w-3 h-3 mr-1" />
          Processing
        </span>
      );
    } else if (status === 'shipped') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
          <Truck className="w-3 h-3 mr-1" />
          Shipped
        </span>
      );
    }
    return null;
  }, []);

  const toggleExpand = useCallback((orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }, []);

  // Address modal
  const handleOpenAddressModal = useCallback((orderId: string) => {
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  }, []);

  const handleConfirmAddress = useCallback(
    (address: DeliveryAddress) => {
      if (selectedOrder) {
        // Persist via context
        updateOrderAddress(selectedOrder, address);
      }
      setAddressModalOpen(false);
      setSelectedOrder(null);
    },
    [selectedOrder, updateOrderAddress]
  );

  const getSelectedOrderAddress = useCallback((): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    const history = Array.isArray(sellerOrderHistory) ? sellerOrderHistory : [];
    const order = history.find((o) => o.id === selectedOrder);
    return order?.deliveryAddress || null;
  }, [selectedOrder, sellerOrderHistory]);

  // AddressDisplay helpers
  const getShippingLabel = useCallback((order: Order) => {
    const a = order.deliveryAddress!;
    // Simple, readable block — matches the AddressDisplay expectation (string)
    return [
      a.fullName,
      a.addressLine1,
      a.addressLine2 ? a.addressLine2 : null,
      `${a.city}, ${a.state} ${a.postalCode}`,
      a.country,
    ]
      .filter(Boolean)
      .join('\n');
  }, []);

  const handleCopyAddress = useCallback((address: NonNullable<Order['deliveryAddress']>) => {
    const text = [
      address.fullName,
      address.addressLine1,
      address.addressLine2 ? address.addressLine2 : null,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      navigator.clipboard.writeText(text);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 1500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  }, []);

  return (
    <RequireAuth role="seller">
      <BanCheck>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-7 h-7 text-orange-400" />
            <h1 className="text-3xl font-bold text-white">Orders to fulfil</h1>
          </div>

          <OrderStats auctionCount={auctionCount} customRequestCount={customRequestCount} standardCount={standardCount} />

          {userOrders.length === 0 ? (
            // Show the embedded empty state in the "Direct purchases" section when no orders
            <OrdersSection
              title="Direct purchases"
              icon={Package}
              iconColor="from-[#ff950e] to-[#e0850d]"
              orders={[]}
              type="direct"
              expandedOrder={expandedOrder}
              onToggleExpand={toggleExpand}
              renderAddressBlock={() => null}
              renderShippingControls={() => null}
              getShippingStatusBadge={getShippingStatusBadge}
              showEmptyState
            />
          ) : (
            <>
              {/* Direct purchases */}
              <OrdersSection
                title="Direct purchases"
                icon={Package}
                iconColor="from-[#ff950e] to-[#e0850d]"
                orders={directOrders}
                type="direct"
                expandedOrder={expandedOrder}
                onToggleExpand={toggleExpand}
                renderAddressBlock={(order) => (
                  <AddressDisplay
                    order={order}
                    copiedText={copiedText}
                    onCopyAddress={handleCopyAddress}
                    getShippingLabel={getShippingLabel}
                  />
                )}
                renderShippingControls={(order) => (
                  <ShippingControls
                    order={order}
                    onStatusChange={(orderId, status) => updateShippingStatus(orderId, status)}
                  />
                )}
                getShippingStatusBadge={getShippingStatusBadge}
              />

              {/* Auctions */}
              <OrdersSection
                title="Auctions"
                icon={Gavel}
                iconColor="from-purple-600 to-purple-400"
                orders={auctionOrders}
                type="auction"
                expandedOrder={expandedOrder}
                onToggleExpand={toggleExpand}
                renderAddressBlock={(order) => (
                  <AddressDisplay
                    order={order}
                    copiedText={copiedText}
                    onCopyAddress={handleCopyAddress}
                    getShippingLabel={getShippingLabel}
                  />
                )}
                renderShippingControls={(order) => (
                  <ShippingControls
                    order={order}
                    onStatusChange={(orderId, status) => updateShippingStatus(orderId, status)}
                  />
                )}
                getShippingStatusBadge={getShippingStatusBadge}
              />

              {/* Custom requests */}
              <OrdersSection
                title="Custom requests"
                icon={Settings}
                iconColor="from-blue-600 to-cyan-500"
                orders={customRequestOrders}
                type="custom"
                expandedOrder={expandedOrder}
                onToggleExpand={toggleExpand}
                renderAddressBlock={(order) => (
                  <AddressDisplay
                    order={order}
                    copiedText={copiedText}
                    onCopyAddress={handleCopyAddress}
                    getShippingLabel={getShippingLabel}
                  />
                )}
                renderShippingControls={(order) => (
                  <ShippingControls
                    order={order}
                    onStatusChange={(orderId, status) => updateShippingStatus(orderId, status)}
                  />
                )}
                getShippingStatusBadge={getShippingStatusBadge}
              />
            </>
          )}

          <AddressConfirmationModal
            isOpen={addressModalOpen}
            onClose={() => setAddressModalOpen(false)}
            onConfirm={handleConfirmAddress}
            existingAddress={getSelectedOrderAddress() ?? undefined}
            orderId={selectedOrder ?? ''}
          />
        </div>
      </BanCheck>
    </RequireAuth>
  );
}
