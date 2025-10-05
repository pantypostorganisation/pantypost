// src/app/buyers/my-orders/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import OrdersHeader from '@/components/buyers/my-orders/OrdersHeader';
import OrderStats from '@/components/buyers/my-orders/OrderStats';
import OrderSections from '@/components/buyers/my-orders/OrderSections';
import EmptyOrdersState from '@/components/buyers/my-orders/EmptyOrdersState';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';
import { useMyOrders } from '@/hooks/useMyOrders';
import { AlertCircle, Loader2 } from 'lucide-react';

// Error component (Enhanced UI styling)
function OrdersError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a]">
      <div className="p-6 md:p-10">
        <div className="max-w-md mx-auto text-center pt-20">
          <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500/10 to-red-600/10 ring-1 ring-red-500/20 backdrop-blur-sm">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Error loading orders</h1>
          <p className="text-base text-gray-400 mb-8">{error}</p>
          <button
            onClick={onRetry}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#ff950e] to-[#ff7a00] text-black font-semibold hover:from-[#ff7a00] hover:to-[#ff950e] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/50 transform hover:scale-105 active:scale-95"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading component (Enhanced UI)
function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a]">
      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 ring-1 ring-[#ff950e]/20 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin" />
            </div>
            <p className="text-gray-300 text-lg">Loading your orders…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses the hooks after providers are ready (Enhanced layout)
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
    expandedOrder,
    setExpandedOrder,
    addressModalOpen,
    setAddressModalOpen,
    selectedOrder,

    // Handlers
    handleOpenAddressModal,
    handleConfirmAddress,
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
    <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a] p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Page Header - Enhanced styling */}
        <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-md p-6 md:p-8 lg:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff950e]/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <OrdersHeader />
          </div>
        </section>

        {/* Stats Cards - Better responsive grid */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-6 backdrop-blur-sm">
          <OrderStats stats={safeStats} />
        </section>

        {/* Orders Section - Enhanced card layout */}
        <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-4 md:p-6">
          {safeUserOrders.length === 0 ? (
            <div className="rounded-xl bg-black/30 backdrop-blur-sm border border-white/5 p-8 md:p-12">
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
    </main>
  );
}

// Main page component with provider readiness check and error boundary
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
