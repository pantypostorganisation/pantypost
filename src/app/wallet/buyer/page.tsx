// src/app/wallet/buyer/page.tsx
'use client';

import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import BackgroundPattern from '@/components/wallet/buyer/BackgroundPattern';
import WalletHeader from '@/components/wallet/buyer/WalletHeader';
import BalanceCard from '@/components/wallet/buyer/BalanceCard';
import TotalSpentCard from '@/components/wallet/buyer/TotalSpentCard';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import RecentPurchases from '@/components/wallet/buyer/RecentPurchases';
import EmptyState from '@/components/wallet/buyer/EmptyState';
import { useBuyerWallet } from '@/hooks/useBuyerWallet';

// Inner component that uses the hooks after providers are ready
function BuyerWalletContent() {
  const {
    // State
    balance,
    amountToAdd,
    message,
    messageType,
    isLoading,
    
    // Computed values
    buyerPurchases,
    recentPurchases,
    totalSpent,
    
    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect
  } = useBuyerWallet();

  return (
    <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      {/* Background Pattern */}
      <BackgroundPattern />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <WalletHeader />

        {/* Balance and Total Spent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BalanceCard balance={balance} />
          <TotalSpentCard totalSpent={totalSpent} totalOrders={buyerPurchases.length} />
        </div>

        {/* Add Funds Section */}
        <AddFundsSection
          amountToAdd={amountToAdd}
          message={message}
          messageType={messageType}
          isLoading={isLoading}
          onAmountChange={handleAmountChange}
          onKeyPress={handleKeyPress}
          onAddFunds={handleAddFunds}
          onQuickAmountSelect={handleQuickAmountSelect}
        />

        {/* Recent Purchases or Empty State */}
        {buyerPurchases.length > 0 ? (
          <RecentPurchases purchases={recentPurchases} />
        ) : (
          <EmptyState showEmptyState={true} />
        )}
      </div>
    </main>
  );
}

// Main page component with provider readiness check
export default function BuyerWalletPage() {
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
          <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff950e] mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Loading wallet...</p>
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
        <BuyerWalletContent />
      </RequireAuth>
    </BanCheck>
  );
}
