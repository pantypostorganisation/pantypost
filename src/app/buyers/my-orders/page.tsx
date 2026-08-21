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
 <div className="min-h-screen bg-[#020202] text-white">
 <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
 <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.03] p-10 text-center">
 <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
 <AlertCircle className="h-10 w-10 text-red-400" />
 </div>
 <h1 className="text-3xl font-semibold tracking-tight">We couldn&apos;t load your orders</h1>
 <p className="mt-3 text-sm text-gray-400">{error}</p>
 <button
 onClick={onRetry}
 className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#ff950e] px-8 py-3 text-base font-semibold text-black transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/60"
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
 <div className="min-h-screen bg-[#020202] text-white">
 <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
 <div className="flex flex-col items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] px-10 py-16">
 <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#ff950e]/40 bg-[#ff950e]/10">
 <Loader2 className="h-8 w-8 animate-spin text-[#ff950e]" />
 </div>
 <p className="text-base text-gray-300">Loading your orders...</p>
 </div>
 </div>
 </div>
 );
}

// Inner component that uses the hooks after providers are ready (Enhanced layout)
function MyOrdersContent() {
 const {
 // Data
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
 /* The page previously rendered its OWN <header> with"My Orders",
 and then ALSO rendered <OrdersHeader /> -- two headings, one above
 the other. Each of the three blocks then sat inside its own
 rounded-lg bordered card with a shadow, so the content was boxes
 inside boxes inside a box.

 Now: one heading, one line of figures, one list. The borders come
 from the figures row and the order cards themselves. */
 <main className="min-h-screen w-full bg-surface">
 <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
 <div className="mb-6">
 <OrdersHeader orderCount={safeUserOrders.length} />
 </div>

 <div className="mb-8">
 <OrderStats stats={safeStats} />
 </div>

 {safeUserOrders.length === 0 ? (
 <EmptyOrdersState />
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

