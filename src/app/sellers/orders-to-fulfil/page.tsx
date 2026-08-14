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
import { AlertCircle, Clock, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';

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

  /* Status badge. Was three separate blocks in yellow, blue and green --
     three colour families for what is one progression. Now the platform's
     own status tokens: warning while it waits on the seller, primary while
     in progress, success once gone. */
  const getShippingStatusBadge = useCallback((status?: string) => {
    const tone =
      status === 'shipped'
        ? 'bg-success-soft text-success'
        : status === 'processing'
          ? 'bg-primary-soft text-primary'
          : 'bg-warning-soft text-warning';

    const label =
      status === 'shipped' ? 'Shipped' : status === 'processing' ? 'Processing' : 'Pending';

    const Icon = status === 'shipped' ? Truck : status === 'processing' ? Package : Clock;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    );
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

  /* One list instead of three sections. Merged and sorted newest first,
     which is how a seller looks for an order ("the one that came in this
     morning") rather than by how it happened to be bought. */
  const allFilteredOrders = useMemo(
    () =>
      [...filteredDirectOrders, ...filteredAuctionOrders, ...filteredCustomOrders].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [filteredDirectOrders, filteredAuctionOrders, filteredCustomOrders]
  );

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <RequireAuth role="seller">
      <BanCheck>
        {/* ---------------------------------------------------------------
          * Was: a rounded-3xl header panel with a "FULFILMENT HUB" label in
          * 0.4em tracking, a pulsing icon, a gradient refresh button and a
          * backdrop-blurred status card; then a rounded-3xl filter panel
          * with uppercase 0.3em labels; then THREE separate order sections
          * (Direct / Auctions / Custom requests) each with its own gradient
          * icon tile; then a green "Fulfilment health" panel restating the
          * counts already shown at the top, beside an orange "Orders
          * needing addresses" panel.
          *
          * Six colour families -- orange, yellow, blue, green, purple and
          * emerald -- on the page a seller uses to get parcels out the door.
          *
          * Now: heading, one line of figures, status filter, one list.
          * --------------------------------------------------------------- */}
        <main className="min-h-screen bg-surface text-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Orders to fulfil</h1>
                <p className="mt-1 text-sm text-ink-muted">
                  {totalAwaitingShipment} awaiting shipment
                  {formattedLastUpdated ? ` - synced ${formattedLastUpdated}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchSellerOrders({ silent: false })}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-primary-line hover:text-ink disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>

            {/* One line of figures. Was a stats component up top AND a
                "Fulfilment health" panel lower down showing the same
                numbers again. */}
            <div className="mb-6 grid grid-cols-3 gap-4 border-y border-line py-5">
              <div>
                <p className="text-lg font-bold tabular-nums text-white sm:text-xl">
                  {statusCounts.pending}
                </p>
                <p className="text-xs text-ink-faint">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-white sm:text-xl">
                  {statusCounts.processing}
                </p>
                <p className="text-xs text-ink-faint">Processing</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums text-white sm:text-xl">
                  {statusCounts.shipped}
                </p>
                <p className="text-xs text-ink-faint">Shipped</p>
              </div>
            </div>

            {/* Orders missing an address: one line, not a gradient panel.
                Checkout now collects the address before payment, so this
                only ever applies to orders placed before that change. */}
            {ordersNeedingAddress.length > 0 && (
              <div className="mb-6 flex items-center gap-2 rounded-md border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {ordersNeedingAddress.length}{' '}
                {ordersNeedingAddress.length === 1 ? 'order needs' : 'orders need'} a delivery
                address before you can ship.
              </div>
            )}

            {/* Status filter */}
            <div className="mb-5 flex flex-wrap gap-2">
              {statusOptions.map(({ value, label }) => {
                const count =
                  value === 'all'
                    ? userOrders.length
                    : statusCounts[value as keyof typeof statusCounts] ?? 0;
                const isActive = statusFilter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value as StatusFilter)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-black'
                        : 'border-line bg-surface-raised text-ink-muted hover:border-primary-line hover:text-ink'
                    }`}
                  >
                    {label} {count}
                  </button>
                );
              })}
            </div>

            {/* ONE list. Orders were split into Direct / Auctions / Custom
                requests, each with its own heading, gradient icon tile and
                empty state -- so three orders could produce three headings
                with one row each, and a seller hunting for "the one I need
                to post today" had to look in three places. How it was
                bought is a detail on the row, not a filing system. */}
            <OrdersSection
              title="All orders"
              icon={ShoppingBag}
              iconColor=""
              orders={allFilteredOrders}
              totalCount={userOrders.length}
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
          </div>

          <AddressConfirmationModal
            isOpen={addressModalOpen}
            onClose={() => {
              setAddressModalOpen(false);
              setSelectedOrder(null);
            }}
            onConfirm={handleConfirmAddress}
            existingAddress={
              selectedOrder
                ? userOrders.find((order) => order.id === selectedOrder)?.deliveryAddress ?? null
                : null
            }
            orderId={selectedOrder ?? ''}
          />
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