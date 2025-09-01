// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/buyer/WalletHeader';
import BalanceCard from '@/components/wallet/buyer/BalanceCard';
import TotalSpentCard from '@/components/wallet/buyer/TotalSpentCard';
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
    totalSpent,

    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
  } = useBuyerWallet();

  const purchasesArray = Array.isArray(buyerPurchases) ? buyerPurchases : [];
  const recentArray = Array.isArray(recentPurchases) ? recentPurchases : [];

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-10">
      {/* Background Pattern - Updated */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255, 149, 14, 0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255, 149, 14, 0.2) 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, rgba(255, 149, 14, 0.15) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <WalletHeader />

        {/* Balance and Total Spent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <BalanceCard balance={balance} />
          <TotalSpentCard totalSpent={totalSpent} totalOrders={purchasesArray.length} />
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
        {purchasesArray.length > 0 ? (
          <RecentPurchases purchases={recentArray} />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

// Wrapper to ensure proper auth flow
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
