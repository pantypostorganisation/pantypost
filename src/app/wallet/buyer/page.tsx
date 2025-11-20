// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import BalanceCard from '@/components/wallet/buyer/BalanceCard';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import RecentPurchases from '@/components/wallet/buyer/RecentPurchases';
import EmptyState from '@/components/wallet/buyer/EmptyState';
import CryptoDepositSection from '@/components/wallet/buyer/CryptoDepositSection';
import DirectCryptoDepositSection from '@/components/wallet/buyer/DirectCryptoDepositSection'; // NEW!
import { useBuyerWallet } from '@/hooks/useBuyerWallet';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

function BuyerWalletContent() {
  // old hook that powers the manual add-funds UI
  const {
    balance: localBalance,
    amountToAdd,
    message,
    messageType,
    isLoading,
    buyerPurchases,
    recentPurchases,
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
  } = useBuyerWallet();

  // new: pull from global wallet context (this one will get the backend value)
  const { getBuyerBalance, reloadData, isInitialized } = useWallet();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'nowpayments' | 'direct'>('direct'); // Default to direct!

  // decide which balance to show: prefer context (backend) if available
  const contextBalance =
    user?.username ? getBuyerBalance(user.username) : undefined;
  const displayBalance =
    typeof contextBalance === 'number' ? contextBalance : localBalance;

  // refresh from backend when we arrive / when auth ready
  useEffect(() => {
    if (user?.username && isInitialized) {
      void reloadData();
    }
  }, [user?.username, isInitialized, reloadData]);

  // show banner if we came back from NOWPayments or direct deposit success
  useEffect(() => {
    const depositStatus = searchParams.get('deposit');
    const directStatus = searchParams.get('direct');
    
    if (depositStatus === 'success' || directStatus === 'success') {
      setShowBanner(true);

      // clean query so it doesn't stay forever
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('deposit');
        url.searchParams.delete('direct');
        router.replace(url.toString());
      }
    }
  }, [searchParams, router]);

  const hasPurchases = Array.isArray(buyerPurchases) && buyerPurchases.length > 0;
  const recentArray = Array.isArray(recentPurchases) ? recentPurchases : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="relative z-10 px-4 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          {/* success banner after crypto redirect */}
          {showBanner && (
            <div className="rounded-lg border border-green-500 bg-green-900/30 p-4 text-center text-green-300">
              ✅ Deposit received — your wallet has been updated.
            </div>
          )}

          {/* main 2-column area */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]">
            {/* left column = live balance */}
            <BalanceCard balance={displayBalance} />

            {/* right column = manual add + crypto deposit */}
            <div className="flex flex-col gap-6">
              <AddFundsSection
                amountToAdd={amountToAdd}
                message={message}
                messageType={messageType}
                isLoading={isLoading}
                onAmountChange={handleAmountChange}
                onKeyPress={handleKeyPress}
                onAddFunds={async () => {
                  // run old handler
                  await handleAddFunds();
                  // then refresh from backend to stay in sync
                  if (user?.username) {
                    void reloadData();
                  }
                }}
                onQuickAmountSelect={handleQuickAmountSelect}
              />

              {/* Payment Method Toggle */}
              <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('direct')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'direct'
                        ? 'bg-[#ff950e] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Direct Wallet (0% Fee) 🏆
                  </button>
                  <button
                    onClick={() => setPaymentMethod('nowpayments')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === 'nowpayments'
                        ? 'bg-[#ff950e] text-black'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    NOWPayments (80% Fee)
                  </button>
                </div>
              </div>

              {/* Crypto deposit component based on selection */}
              {paymentMethod === 'direct' ? (
                <DirectCryptoDepositSection />
              ) : (
                <CryptoDepositSection />
              )}
            </div>
          </section>

          {/* purchases */}
          {hasPurchases ? (
            <RecentPurchases purchases={recentArray} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </main>
  );
}

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

export default function BuyerWalletPage() {
  return (
    <BanCheck>
      <BuyerWalletWrapper />
    </BanCheck>
  );
}
