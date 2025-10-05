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
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="absolute inset-0">
        <div className="pointer-events-none absolute -top-40 right-[-20%] h-[480px] w-[480px] rounded-full bg-[#ff950e]/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-30%] left-[-10%] h-[420px] w-[420px] rounded-full bg-[#ff7a00]/10 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center shadow-[0_25px_80px_-40px_rgba(255,149,14,0.45)] backdrop-blur-xl">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">We couldn't load your orders</h1>
          <p className="mt-3 text-sm text-gray-400">{error}</p>
          <button
            onClick={onRetry}
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff950e] to-[#ff7a00] px-8 py-3 text-base font-semibold text-black shadow-[0_18px_45px_-25px_rgba(255,149,14,0.9)] transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/60"
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
    <div className="relative min-h-screen overflow-hidden bg-[#020202] text-white">
      <div className="absolute inset-0">
        <div className="pointer-events-none absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff950e]/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10%] left-1/3 h-[420px] w-[420px] rounded-full bg-[#ff7a00]/10 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-10 py-16 shadow-[0_20px_60px_-30px_rgba(255,149,14,0.4)] backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff950e]" />
          </div>
          <p className="text-base text-gray-300">Loading your orders…</p>
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
    <main className="relative min-h-screen overflow-hidden bg-[#020202]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-15%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#ff950e]/15 blur-3xl" />
        <div className="absolute right-[-10%] top-[30%] h-[480px] w-[480px] rounded-full bg-[#ff7a00]/12 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[25%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {/* Page Header */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-12 shadow-[0_30px_90px_-45px_rgba(255,149,14,0.6)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.15),_transparent_55%)]" />
            <div className="relative z-10">
              <OrdersHeader />
            </div>
          </section>

          {/* Stats */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 lg:p-8 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <OrderStats stats={safeStats} />
          </section>

          {/* Orders */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 lg:p-8 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            {safeUserOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-black/40 p-10">
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
        </div>
      </div>

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
