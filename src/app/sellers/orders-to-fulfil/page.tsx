// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
import { sanitizeStrict } from '@/utils/security/sanitization';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Gavel,
  ListFilter,
  Package,
  RefreshCw,
  Settings,
  ShoppingBag,
  Truck,
} from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Fetch seller orders directly from backend to ensure this page shows orders to fulfil
  const fetchSellerOrders = useCallback(
    async ({ showLoader = false, silent = false }: FetchOptions = {}) => {
      if (!user?.username) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (showLoader) {
        setIsLoading(true);
      } else if (!silent) {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const response = await apiClient.get<any>(`/orders?seller=${encodeURIComponent(user.username)}`);

        if (response?.success && Array.isArray(response.data)) {
          setSellerOrderHistory(response.data);
          setLastUpdated(Date.now());
          console.log('[OrdersToFulfilPage] Loaded orders:', response.data.length);
        } else {
          console.error('[OrdersToFulfilPage] Invalid response format:', response);
          setError('Failed to load orders. Please refresh the page.');
        }
      } catch (err) {
        console.error('[OrdersToFulfilPage] Failed to fetch seller orders:', err);
        setError('Failed to load orders. Please check your connection and try again.');
      } finally {
        if (showLoader) {
          setIsLoading(false);
        } else if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [user?.username, apiClient]
  );

  useEffect(() => {
    fetchSellerOrders({ showLoader: true });

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => fetchSellerOrders({ silent: true }), 30000);

    return () => clearInterval(interval);
  }, [fetchSellerOrders]);

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

  const statusCounts = useMemo(
    () =>
      userOrders.reduce(
        (acc, order) => {
          const status = (order.shippingStatus as StatusFilter) || 'pending';
          if (status === 'processing') {
            acc.processing += 1;
          } else if (status === 'shipped') {
            acc.shipped += 1;
          } else {
            acc.pending += 1;
          }
          return acc;
        },
        { pending: 0, processing: 0, shipped: 0 }
      ),
    [userOrders]
  );

  const filterByStatus = useCallback(
    (orders: Order[]) => {
      if (statusFilter === 'all') {
        return orders;
      }

      return orders.filter((order) => {
        const status = (order.shippingStatus as StatusFilter | undefined) ?? 'pending';
        return status === statusFilter;
      });
    },
    [statusFilter]
  );

  const filteredDirectOrders = useMemo(() => filterByStatus(directOrders), [directOrders, filterByStatus]);
  const filteredAuctionOrders = useMemo(() => filterByStatus(auctionOrders), [auctionOrders, filterByStatus]);
  const filteredCustomOrders = useMemo(() => filterByStatus(customRequestOrders), [customRequestOrders, filterByStatus]);

  const ordersNeedingAddress = useMemo(
    () => userOrders.filter((order) => !order.deliveryAddress).slice(0, 3),
    [userOrders]
  );

  const totalAwaitingShipment = useMemo(
    () => userOrders.filter((order) => (order.shippingStatus ?? 'pending') !== 'shipped').length,
    [userOrders]
  );

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

  const statusOptions: StatusOption[] = [
    {
      value: 'all',
      label: 'All orders',
      description: `${userOrders.length} total`,
    },
    {
      value: 'pending',
      label: 'Awaiting action',
      description: `${statusCounts.pending} pending`,
      icon: Clock,
    },
    {
      value: 'processing',
      label: 'In progress',
      description: `${statusCounts.processing} processing`,
      icon: Package,
    },
    {
      value: 'shipped',
      label: 'Completed',
      description: `${statusCounts.shipped} shipped`,
      icon: Truck,
    },
  ];

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <RequireAuth role="seller">
      <BanCheck>
        <main className="min-h-screen bg-gradient-to-b from-black via-[#08080c] to-black text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-10">
            <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a1a] p-8">
              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/15 p-3">
                      <ShoppingBag className="h-8 w-8 text-[#ffb347]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Fulfilment hub</p>
                      <h1 className="text-3xl font-bold text-white sm:text-4xl">Orders to fulfil</h1>
                    </div>
                  </div>
                  <p className="text-base text-white/70">
                    Manage every order in one place, keep buyers updated in real-time, and never miss a shipment deadline.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <Clock className="h-4 w-4" />
                    <span>
                      Auto-refreshing every <strong>30 seconds</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {formattedLastUpdated ? (
                      <span>Last synced at {formattedLastUpdated}</span>
                    ) : (
                      <span>Syncing orders...</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchSellerOrders({})}
                    disabled={isRefreshing || isLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#ff950e]/60 bg-gradient-to-r from-[#ff950e]/90 to-[#ff6a00]/90 px-4 py-2 text-sm font-semibold text-black shadow-lg transition-all hover:from-[#ffb347] hover:to-[#ff950e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRefreshing ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black" />
                        Refreshing
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Refresh now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </header>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  <ListFilter className="h-4 w-4" />
                  Filter by status
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(({ value, label, description, icon: Icon }) => {
                    const isActive = statusFilter === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value)}
                        className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all sm:text-base ${
                          isActive
                            ? 'border-white/60 bg-white/15 text-white shadow-lg shadow-black/30'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {Icon ? <Icon className="h-4 w-4" /> : <span className="h-2.5 w-2.5 rounded-full bg-white/50" />}
                          <span className="font-semibold">{label}</span>
                        </span>
                        <span className="text-xs text-white/60 sm:text-sm">{description}</span>
                        {isActive && <span className="absolute inset-0 rounded-xl border border-white/40" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
                  <OrderStats auctionCount={auctionCount} customRequestCount={customRequestCount} standardCount={standardCount} />
                </div>

                {userOrders.length === 0 ? (
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
                    totalCount={0}
                    filterActive={statusFilter !== 'all'}
                  />
                ) : (
                  <>
                    <OrdersSection
                      title="Direct purchases"
                      icon={Package}
                      iconColor="from-[#ff950e] to-[#e0850d]"
                      orders={filteredDirectOrders}
                      totalCount={directOrders.length}
                      filterActive={statusFilter !== 'all'}
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
                        <ShippingControls order={order} onStatusChange={handleShippingStatusChange} />
                      )}
                      getShippingStatusBadge={getShippingStatusBadge}
                    />

                    <OrdersSection
                      title="Auctions"
                      icon={Gavel}
                      iconColor="from-purple-600 to-purple-400"
                      orders={filteredAuctionOrders}
                      totalCount={auctionOrders.length}
                      filterActive={statusFilter !== 'all'}
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
                        <ShippingControls order={order} onStatusChange={handleShippingStatusChange} />
                      )}
                      getShippingStatusBadge={getShippingStatusBadge}
                    />

                    <OrdersSection
                      title="Custom requests"
                      icon={Settings}
                      iconColor="from-blue-600 to-cyan-500"
                      orders={filteredCustomOrders}
                      totalCount={customRequestOrders.length}
                      filterActive={statusFilter !== 'all'}
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
                        <ShippingControls order={order} onStatusChange={handleShippingStatusChange} />
                      )}
                      getShippingStatusBadge={getShippingStatusBadge}
                    />
                  </>
                )}
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-emerald-100">Fulfilment health</h3>
                  <p className="mt-2 text-sm text-emerald-200/80">
                    {totalAwaitingShipment > 0
                      ? `You have ${totalAwaitingShipment} orders awaiting shipment updates.`
                      : 'All orders are marked as shipped. Great work!'}
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Pending</p>
                      <p className="mt-2 text-2xl font-bold text-white">{statusCounts.pending}</p>
                      <p className="text-xs text-white/60">Waiting to be processed</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Processing</p>
                      <p className="mt-2 text-2xl font-bold text-white">{statusCounts.processing}</p>
                      <p className="text-xs text-white/60">Currently being prepared</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/50">Shipped</p>
                      <p className="mt-2 text-2xl font-bold text-white">{statusCounts.shipped}</p>
                      <p className="text-xs text-white/60">Completed and notified</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#ff950e]/30 bg-gradient-to-br from-[#ff950e]/20 via-[#20140c]/60 to-[#ff6a00]/20 p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-white">Orders needing addresses</h3>
                  <p className="mt-2 text-sm text-white/70">
                    Reach out to buyers or add the address manually to keep these orders moving.
                  </p>
                  {ordersNeedingAddress.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                      Every order has a delivery address. 🎉
                    </div>
                  ) : (
                    <ul className="mt-5 space-y-3">
                      {ordersNeedingAddress.map((order) => (
                        <li key={order.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                          <p className="text-sm font-semibold text-white">{sanitizeStrict(order.title)}</p>
                          <p className="mt-1 text-xs text-white/60">
                            Buyer: <span className="font-medium text-white/80">{sanitizeStrict(order.buyer)}</span>
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link
                              href={`/sellers/messages?thread=${encodeURIComponent(order.buyer)}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:border-white/40 hover:bg-white/20"
                            >
                              Message buyer
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white">Fulfilment tips</h3>
                  <ul className="mt-4 space-y-3 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff950e]" />
                      Update shipping status as soon as you move an order to keep buyers informed instantly.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff950e]" />
                      Use the copy address button when preparing shipping labels to avoid mistakes.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff950e]" />
                      Message buyers directly from each order card if you need clarifications or updates.
                    </li>
                  </ul>
                </div>
              </aside>
            </div>

            <AddressConfirmationModal
              isOpen={addressModalOpen}
              onClose={() => setAddressModalOpen(false)}
              onConfirm={handleConfirmAddress}
              existingAddress={getSelectedOrderAddress() ?? undefined}
              orderId={selectedOrder ?? ''}
            />
          </div>
        </main>
      </BanCheck>
    </RequireAuth>
  );
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped';

type StatusOption = {
  value: StatusFilter;
  label: string;
  description: string;
  icon?: typeof Clock;
};

type FetchOptions = {
  showLoader?: boolean;
  silent?: boolean;
};
