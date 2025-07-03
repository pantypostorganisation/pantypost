// src/app/wallet/seller/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/seller/WalletHeader';
import BalanceCard from '@/components/wallet/seller/BalanceCard';
import EarningsCard from '@/components/wallet/seller/EarningsCard';
import WithdrawSection from '@/components/wallet/seller/WithdrawSection';
import RecentWithdrawals from '@/components/wallet/seller/RecentWithdrawals';
import EmptyState from '@/components/wallet/seller/EmptyState';
import WithdrawConfirmModal from '@/components/wallet/seller/WithdrawConfirmModal';
import { useSellerWallet } from '@/hooks/useSellerWallet';

// Inner component that uses the hooks after providers are ready
function SellerWalletContent() {
  const {
    // State
    balance,
    withdrawAmount,
    message,
    messageType,
    isLoading,
    showConfirmation,
    
    // Computed values
    sortedWithdrawals,
    totalWithdrawn,
    totalEarnings,
    recentWithdrawals,
    sellerSales,
    
    // Actions
    handleWithdrawClick,
    handleConfirmWithdraw,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    setShowConfirmation,
    setWithdrawAmount
  } = useSellerWallet();

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <WalletHeader />

        {/* Balance and Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BalanceCard balance={balance} />
          <EarningsCard 
            totalEarnings={totalEarnings} 
            totalWithdrawn={totalWithdrawn}
            salesCount={sellerSales.length} 
          />
        </div>

        {/* Withdraw Section */}
        <WithdrawSection
          balance={balance}
          withdrawAmount={withdrawAmount}
          message={message}
          messageType={messageType}
          isLoading={isLoading}
          onAmountChange={handleAmountChange}
          onKeyPress={handleKeyPress}
          onWithdraw={handleWithdrawClick}
          onQuickAmountSelect={handleQuickAmountSelect}
        />

        {/* Recent Withdrawals or Empty State */}
        {sortedWithdrawals.length > 0 ? (
          <RecentWithdrawals withdrawals={recentWithdrawals} />
        ) : (
          <EmptyState showEmptyState={true} />
        )}
      </div>

      {/* Confirmation Modal */}
      <WithdrawConfirmModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        withdrawAmount={withdrawAmount}
        isLoading={isLoading}
        handleConfirmWithdraw={handleConfirmWithdraw}
      />
    </main>
  );
}

// Main page component with provider readiness check
export default function SellerWalletPage() {
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
        <RequireAuth role="seller">
          <main className="min-h-screen bg-black text-white p-4 md:p-8">
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
      <RequireAuth role="seller">
        <SellerWalletContent />
      </RequireAuth>
    </BanCheck>
  );
}