// src/app/buyers/my-orders/page.tsx
'use client';

import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import OrdersHeader from '@/components/buyers/my-orders/OrdersHeader';
import OrderStats from '@/components/buyers/my-orders/OrderStats';
import OrderFilters from '@/components/buyers/my-orders/OrderFilters';
import OrderSections from '@/components/buyers/my-orders/OrderSections';
import EmptyOrdersState from '@/components/buyers/my-orders/EmptyOrdersState';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';
import { useMyOrders } from '@/hooks/useMyOrders';

// Inner component that uses the hooks after providers are ready
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <OrdersHeader />
        
        <OrderStats stats={stats} />
        
        <OrderFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onToggleSort={toggleSort}
        />
        
        {userOrders.length === 0 ? (
          <EmptyOrdersState />
        ) : (
          <OrderSections
            directOrders={directOrders}
            customRequestOrders={customRequestOrders}
            auctionOrders={auctionOrders}
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

// Main page component with provider readiness check
export default function MyOrdersPage() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Small delay to ensure providers are mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff950e] mx-auto mb-4"></div>
                <p className="text-gray-400">Loading orders...</p>
              </div>
            </div>
          </main>
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
