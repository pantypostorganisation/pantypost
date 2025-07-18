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
import { useRouter } from 'next/navigation';

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

// Wrapper to ensure proper auth flow
function SellerWalletWrapper() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    // Check if user is authorized
    const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
    const canAccess = user && (user.role === 'seller' || isAdmin);

    if (!canAccess) {
      console.log('[SellerWallet] Unauthorized access, redirecting to login');
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [user, isAuthReady, router]);

  if (!isAuthReady || isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return <SellerWalletContent />;
}

// Main page component with provider readiness check
export default function SellerWalletPage() {
  return (
    <BanCheck>
      <RequireAuth role="seller">
        <SellerWalletWrapper />
      </RequireAuth>
    </BanCheck>
  );
}
