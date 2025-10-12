// src/app/wallet/seller/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/seller/WalletHeader';
import WithdrawSection from '@/components/wallet/seller/WithdrawSection';
import RecentWithdrawals from '@/components/wallet/seller/RecentWithdrawals';
import EmptyState from '@/components/wallet/seller/EmptyState';
import WithdrawConfirmModal from '@/components/wallet/seller/WithdrawConfirmModal';
import BackgroundPattern from '@/components/wallet/seller/BackgroundPattern';
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
    todaysWithdrawals,
    withdrawalLimits,
    remainingDailyLimit,
    validationError,

    // Actions
    handleWithdrawClick,
    handleConfirmWithdraw,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    setShowConfirmation,
  } = useSellerWallet();

  // Guard against unexpected non-array values
  const salesArray = Array.isArray(sellerSales) ? sellerSales : [];
  const sortedArray = Array.isArray(sortedWithdrawals) ? sortedWithdrawals : [];
  const recentArray = Array.isArray(recentWithdrawals) ? recentWithdrawals : [];
  const totalSalesCount = salesArray.length;
  const hasWithdrawals = sortedArray.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <BackgroundPattern />

      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 lg:p-10">
            <WalletHeader
              balance={balance}
              totalEarnings={totalEarnings}
              totalWithdrawn={totalWithdrawn}
              salesCount={totalSalesCount}
              recentWithdrawalsCount={recentArray.length}
              remainingDailyLimit={remainingDailyLimit}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
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
              remainingDailyLimit={remainingDailyLimit}
              todaysWithdrawals={todaysWithdrawals}
              withdrawalLimits={withdrawalLimits}
              validationError={validationError}
            />

            {hasWithdrawals ? (
              <RecentWithdrawals withdrawals={recentArray} />
            ) : (
              <EmptyState showEmptyState={true} />
            )}
          </section>
        </div>
      </div>

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
    const isAdmin = user?.role === 'admin';
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

  const isAdmin = user?.role === 'admin';
  const roleForAuth = isAdmin ? 'admin' : 'seller';

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
