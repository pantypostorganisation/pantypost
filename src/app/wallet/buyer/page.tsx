// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/buyer/WalletHeader';
import BalanceCard from '@/components/wallet/buyer/BalanceCard';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import RecentPurchases from '@/components/wallet/buyer/RecentPurchases';
import EmptyState from '@/components/wallet/buyer/EmptyState';
import { useBuyerWallet } from '@/hooks/useBuyerWallet';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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

    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
  } = useBuyerWallet();

  const purchasesArray = Array.isArray(buyerPurchases) ? buyerPurchases : [];
  const recentArray = Array.isArray(recentPurchases) ? recentPurchases : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a] text-white p-4 md:p-10">
      {/* Enhanced Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-[#ff950e] rounded-full mix-blend-screen filter blur-[128px]" />
          <div className="absolute top-1/2 -right-4 w-96 h-96 bg-orange-600 rounded-full mix-blend-screen filter blur-[128px]" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#ff950e] rounded-full mix-blend-screen filter blur-[128px]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <WalletHeader />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card - Spans 1 column */}
          <div className="lg:col-span-1">
            <BalanceCard balance={balance} />
          </div>

          {/* Add Funds Section - Spans 2 columns on large screens */}
          <div className="lg:col-span-2">
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
          </div>
        </div>

        {/* Recent Purchases or Empty State */}
        {purchasesArray.length > 0 ? (
          <RecentPurchases purchases={recentArray} />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

// Wrapper to ensure proper auth flow (unchanged)
function BuyerWalletWrapper() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    const isAdmin = user?.role === 'admin';
    const canAccess = user && (user.role === 'buyer' || isAdmin);

    if (!canAccess) {
      console.log('[BuyerWallet] Unauthorized access, redirecting to login');
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
  const roleForAuth = isAdmin ? 'admin' : 'buyer';

  return (
    <RequireAuth role={roleForAuth as 'buyer' | 'admin'}>
      <BuyerWalletContent />
    </RequireAuth>
  );
}

// Main component with auth wrappers
export default function BuyerWalletPage() {
  return (
    <BanCheck>
      <BuyerWalletWrapper />
    </BanCheck>
  );
}

