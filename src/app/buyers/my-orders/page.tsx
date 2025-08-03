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

// Error component
function OrdersError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
      <div className="max-w-md mx-auto text-center pt-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Orders</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff7a00] transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Loading component
function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your orders...</p>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses the hooks after providers are ready
function MyOrdersContent() {
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // Force re-render to retry data fetching
    window.location.reload();
  };

  // Show error state
  if (error && !isLoading) {
    return <OrdersError error={error} onRetry={handleRetry} />;
  }

  // Show loading state
  if (isLoading) {
    return <OrdersLoading />;
  }

  // Safe default values for stats
  const safeStats = {
    totalSpent: stats?.totalSpent ?? 0,
    pendingOrders: stats?.pendingOrders ?? 0,
    shippedOrders: stats?.shippedOrders ?? 0
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <OrdersHeader />
        
        <OrderStats stats={safeStats} />
        
        <OrderFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onToggleSort={toggleSort}
        />
        
        {!userOrders || userOrders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <OrderSections
            directOrders={directOrders || []}
            customRequestOrders={customRequestOrders || []}
            auctionOrders={auctionOrders || []}
            expandedOrder={expandedOrder}
            onToggleExpanded={setExpandedOrder}
            onOpenAddressModal={handleOpenAddressModal}
          />
        )}
        
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