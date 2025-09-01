// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';

// Seller orders UI
import OrderStats from '@/components/seller/orders/OrderStats';
import OrdersSection from '@/components/seller/orders/OrdersSection';
import AddressDisplay from '@/components/seller/orders/AddressDisplay';
import ShippingControls from '@/components/seller/orders/ShippingControls';

import type { DeliveryAddress, Order } from '@/types/order';
import { Clock, Package, Truck, Gavel, Settings, ShoppingBag, AlertCircle } from 'lucide-react';

export default function OrdersToFulfilPage() {
  const { user, apiClient } = useAuth();
  const { updateOrderAddress, updateShippingStatus } = useWallet();
  const { showToast } = useToast();

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [sellerOrderHistory, setSellerOrderHistory] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch seller orders directly from backend to ensure this page shows orders to fulfil
  useEffect(() => {
    const fetchSellerOrders = async () => {
      if (!user?.username) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<any>(`/orders?seller=${encodeURIComponent(user.username)}`);
        
        if (response?.success && Array.isArray(response.data)) {
          setSellerOrderHistory(response.data);
          console.log('[OrdersToFulfilPage] Loaded orders:', response.data.length);
        } else {
          console.error('[OrdersToFulfilPage] Invalid response format:', response);
          setError('Failed to load orders. Please refresh the page.');
        }
      } catch (err) {
        console.error('[OrdersToFulfilPage] Failed to fetch seller orders:', err);
        setError('Failed to load orders. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSellerOrders();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSellerOrders, 30000);
    
    return () => clearInterval(interval);
  }, [user?.username, apiClient]);

  // Listen for order updates via WebSocket
  useEffect(() => {
    const handleOrderUpdate = (event: CustomEvent) => {
      const { orderId, shippingStatus, hasAddress } = event.detail;
      
      setSellerOrderHistory(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            shippingStatus: shippingStatus || order.shippingStatus,
            deliveryAddress: hasAddress ? order.deliveryAddress : undefined
          };
        }
        return order;
      }));
    };

    window.addEventListener('order:updated' as any, handleOrderUpdate);
    return () => window.removeEventListener('order:updated' as any, handleOrderUpdate);
  }, []);

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
    async (address: DeliveryAddress) => {
      if (selectedOrder) {
        try {
          // Persist via context
          await updateOrderAddress(selectedOrder, address);
          showToast({ 
            type: 'success',
            title: 'Success',
            message: 'Address updated successfully' 
          });
        } catch (error) {
          console.error('[OrdersToFulfilPage] Failed to update address:', error);
          showToast({ 
            type: 'error',
            title: 'Error',
            message: 'Failed to update address. Please try again.' 
          });
        }
      }
      setAddressModalOpen(false);
      setSelectedOrder(null);
    },
    [selectedOrder, updateOrderAddress, showToast]
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
      showToast({ 
        type: 'success',
        title: 'Copied',
        message: 'Address copied to clipboard' 
      });
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      showToast({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to copy address' 
      });
    }
  }, [showToast]);

  // Enhanced shipping status change handler
  const handleShippingStatusChange = useCallback(
    async (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
      try {
        await updateShippingStatus(orderId, status);
        
        // Update local state immediately for better UX
        setSellerOrderHistory(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, shippingStatus: status }
            : order
        ));
        
        // Show success message
        const statusMessages = {
          pending: 'Order marked as pending',
          processing: 'Order marked as processing',
          shipped: 'Order marked as shipped! Buyer has been notified.'
        };
        
        showToast({ 
          type: 'success',
          title: 'Status Updated',
          message: statusMessages[status] 
        });
      } catch (error) {
        console.error('[OrdersToFulfilPage] Failed to update shipping status:', error);
        showToast({ 
          type: 'error',
          title: 'Error',
          message: 'Failed to update shipping status. Please try again.' 
        });
      }
    },
    [updateShippingStatus, showToast]
  );

  // Loading state
  if (isLoading) {
    return (
      <RequireAuth role="seller">
        <BanCheck>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-7 h-7 text-orange-400 animate-pulse" />
              <h1 className="text-3xl font-bold text-white">Orders to fulfil</h1>
            </div>
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff950e]"></div>
              <p className="text-gray-400 mt-4">Loading your orders...</p>
            </div>
          </div>
        </BanCheck>
      </RequireAuth>
    );
  }

  // Error state
  if (error) {
    return (
      <RequireAuth role="seller">
        <BanCheck>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-7 h-7 text-orange-400" />
              <h1 className="text-3xl font-bold text-white">Orders to fulfil</h1>
            </div>
            <div className="text-center py-16 bg-red-900/20 rounded-2xl border border-red-500/30">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-red-300 text-xl mb-2">{error}</h3>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </BanCheck>
      </RequireAuth>
    );
  }

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
                    onStatusChange={handleShippingStatusChange}
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
                    onStatusChange={handleShippingStatusChange}
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
                    onStatusChange={handleShippingStatusChange}
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
