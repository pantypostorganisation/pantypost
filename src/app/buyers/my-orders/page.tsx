// src/app/buyers/my-orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import OrdersHeader from '@/components/buyers/my-orders/OrdersHeader';
import OrderStats from '@/components/buyers/my-orders/OrderStats';
import OrderFilters from '@/components/buyers/my-orders/OrderFilters';
import OrderSections from '@/components/buyers/my-orders/OrderSections';
import EmptyOrdersState from '@/components/buyers/my-orders/EmptyOrdersState';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';
import { useMyOrders } from '@/hooks/useMyOrders';
import { AlertCircle, Loader2 } from 'lucide-react';

// Error component (UI-only styling tweaks)
function OrdersError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-black">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff7a00] via-[#ff950e] to-[#ffbd59]" />
      <div className="p-4 md:p-10">
        <div className="max-w-md mx-auto text-center pt-16">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Error loading orders</h1>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-[#ff950e] text-black font-medium hover:bg-[#ff7a00] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/50"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading component (UI-only styling tweaks)
function OrdersLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff7a00] via-[#ff950e] to-[#ffbd59]" />
      <div className="p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff950e]/10 ring-1 ring-[#ff950e]/20">
              <Loader2 className="w-6 h-6 text-[#ff950e] animate-spin" />
            </div>
            <p className="text-gray-400">Loading your orders…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses the hooks after providers are ready (UI-only layout polish)
function MyOrdersContent() {
  const {
    // Data
    user,
    userOrders,
    directOrders,
    customRequestOrders,
    auctionOrders,
    stats,

    // UI State
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    filterStatus,
    setFilterStatus,
    expandedOrder,
    setExpandedOrder,
    addressModalOpen,
    setAddressModalOpen,
    selectedOrder,

    // Handlers
    handleOpenAddressModal,
    handleConfirmAddress,
    toggleSort,
    getSelectedOrderAddress,
  } = useMyOrders();

  // Safe arrays to avoid undefined checks everywhere
  const safeUserOrders = userOrders ?? [];
  const safeDirectOrders = directOrders ?? [];
  const safeCustomRequestOrders = customRequestOrders ?? [];
  const safeAuctionOrders = auctionOrders ?? [];

  // Safe default values for stats
  const safeStats = {
    totalSpent: stats?.totalSpent ?? 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    shippedOrders: stats?.shippedOrders ?? 0,
  };

  return (
    <main className="min-h-screen bg-black">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff7a00] via-[#ff950e] to-[#ffbd59]" />
      <div className="p-4 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <section className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-4 md:p-6">
            <OrdersHeader />
          </section>

          {/* Stats */}
          <section className="rounded-2xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur supports-[backdrop-filter]:bg-white/5">
            <OrderStats stats={safeStats} />
          </section>

          {/* Sticky Filters */}
          <section
            className="sticky top-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-10 border-y border-white/5 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60"
            aria-label="Order filters"
          >
            <div className="mx-auto max-w-7xl px-4 md:px-6 py-3">
              <OrderFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onToggleSort={toggleSort}
              />
            </div>
          </section>

          {/* Sections */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.04] p-2 md:p-4">
            {safeUserOrders.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-black/30 p-6 md:p-10">
                <EmptyOrdersState />
              </div>
            ) : (
              <OrderSections
                directOrders={safeDirectOrders}
                customRequestOrders={safeCustomRequestOrders}
                auctionOrders={safeAuctionOrders}
                expandedOrder={expandedOrder}
                onToggleExpanded={setExpandedOrder}
                onOpenAddressModal={handleOpenAddressModal}
              />
            )}
          </section>

          {/* Address Modal */}
          <AddressConfirmationModal
            isOpen={addressModalOpen}
            onClose={() => {
              setAddressModalOpen(false);
            }}
            onConfirm={handleConfirmAddress}
            existingAddress={getSelectedOrderAddress()}
            orderId={selectedOrder || ''}
          />
        </div>
      </div>
    </main>
  );
}

// Main page component with provider readiness check and error boundary (unchanged logic)
export default function MyOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset error state on mount
  useEffect(() => {
    if (hasError) {
      setHasError(false);
      setError(null);
    }
  }, [hasError]);

  // Simple error boundary behavior
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Orders page error:', event.error);
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError && error) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <OrdersError
            error={error.message || 'An unexpected error occurred'}
            onRetry={() => {
              setHasError(false);
              setError(null);
              window.location.reload();
            }}
          />
        </RequireAuth>
      </BanCheck>
    );
  }

  if (!mounted) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <OrdersLoading />
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <MyOrdersContent />
      </RequireAuth>
    </BanCheck>
  );
}
