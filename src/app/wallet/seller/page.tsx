'use client';

import React, { useState, useEffect } from 'react';
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
import { isAdmin as isAdminRole } from '@/utils/security/permissions';

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
    setWithdrawAmount,
  } = useSellerWallet();

  // Guard against unexpected non-array values
  const salesArray = Array.isArray(sellerSales) ? sellerSales : [];
  const sortedArray = Array.isArray(sortedWithdrawals) ? sortedWithdrawals : [];
  const recentArray = Array.isArray(recentWithdrawals) ? recentWithdrawals : [];

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
            salesCount={salesArray.length}
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
        {sortedArray.length > 0 ? (
          <RecentWithdrawals withdrawals={recentArray} />
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
    const isAdminUser = isAdminRole(user);
    const canAccess = !!user && (user.role === 'seller' || isAdminUser);

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
          <div
            className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    );
  }

  const isAdminUser = isAdminRole(user);
  const roleForAuth = isAdminUser ? 'admin' : 'seller';

  return (
    <RequireAuth role={roleForAuth as 'seller' | 'admin'}>
      <SellerWalletContent />
    </RequireAuth>
  );
}

// Main page component
export default function SellerWalletPage() {
  return (
    <BanCheck>
      <SellerWalletWrapper />
    </BanCheck>
  );
}
