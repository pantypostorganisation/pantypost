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

// 👉 new import
import CryptoDepositSection from '@/components/wallet/buyer/CryptoDepositSection';

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
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 lg:p-10">
            <WalletHeader />
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
            {/* left column */}
            <BalanceCard balance={balance} />

            {/* right column */}
            <div className="flex flex-col gap-6">
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

              {/* new crypto deposit UI */}
              <CryptoDepositSection />
            </div>
          </section>

          {purchasesArray.length > 0 ? (
            <RecentPurchases purchases={recentArray} />
          ) : (
            <EmptyState />
          )}
        </div>
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
          <div className="w-4 h-4 rounded-full bg-[#ff950e] animate-pulse"></div>
          <div
            className="w-4 h-4 rounded-full bg-[#ff950e] animate-pulse"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-4 h-4 rounded-full bg-[#ff950e] animate-pulse"
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
