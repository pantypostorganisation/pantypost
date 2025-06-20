// src/app/wallet/buyer/page.tsx
'use client';

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

export default function BuyerWalletPage() {
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
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white">
          {/* Background Pattern */}
          <BackgroundPattern />
          
          <div className="relative z-10 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <WalletHeader />

              {/* Balance and Total Spent Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

              {/* Recent Purchases */}
              <RecentPurchases purchases={recentPurchases} />

              {/* Empty State */}
              <EmptyState showEmptyState={buyerPurchases.length === 0} />
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}