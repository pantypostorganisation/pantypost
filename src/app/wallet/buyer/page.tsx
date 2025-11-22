// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import CryptoDepositSection from '@/components/wallet/buyer/CryptoDepositSection';
import DirectCryptoDepositSection from '@/components/wallet/buyer/DirectCryptoDepositSection';
import AllDepositsSection from '@/components/wallet/buyer/AllDepositsSection';
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
  const [depositHistory, setDepositHistory] = useState<any[]>([]);

  // decide which balance to show: prefer context (backend) if available
  const contextBalance =
    user?.username ? getBuyerBalance(user.username) : undefined;
  const displayBalance =
    typeof contextBalance === 'number' ? contextBalance : localBalance;

  // refresh from backend when we arrive / when auth ready
  useEffect(() => {
    if (user?.username && isInitialized) {
      void reloadData();
      void loadDepositHistory();
    }
  }, [user?.username, isInitialized, reloadData]);

  // Load deposit history - FIXED to use correct endpoint
  const loadDepositHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com/api';
      
      const res = await fetch(`${API_URL}/wallet/deposits/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const data = await res.json();
      if (data.success) {
        setDepositHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load deposit history:', err);
    }
  };

  // show banner if we came back from NOWPayments or direct deposit success
  useEffect(() => {
    const depositStatus = searchParams.get('deposit');
    const directStatus = searchParams.get('direct');
    
    if (depositStatus === 'success' || directStatus === 'success') {
      setShowBanner(true);
      void loadDepositHistory(); // Reload history on success

      // clean query so it doesn't stay forever
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('deposit');
        url.searchParams.delete('direct');
        router.replace(url.toString());
      }
    }
  }, [searchParams, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          {/* success banner after crypto redirect */}
          {showBanner && (
            <div className="rounded-lg border border-green-500 bg-green-900/30 p-4 text-center text-green-300">
              ✅ Deposit received — your wallet has been updated.
            </div>
          )}

          {/* Main Content Area - Now full width */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Card Deposit Section */}
            <AddFundsSection
              balance={displayBalance}
              amountToAdd={amountToAdd}
              message={message}
              messageType={messageType}
              isLoading={isLoading}
              onAmountChange={handleAmountChange}
              onKeyPress={handleKeyPress}
              onAddFunds={async () => {
                await handleAddFunds();
                if (user?.username) {
                  void reloadData();
                  void loadDepositHistory();
                }
              }}
              onQuickAmountSelect={handleQuickAmountSelect}
            />

            {/* Crypto Deposit Section */}
            <div className="flex flex-col gap-6">
              {/* Payment Method Toggle */}
              <div className="rounded-xl border border-gray-800 bg-[#111] p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Crypto Payment Method</h3>
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
          </div>

          {/* All Deposits Section */}
          <AllDepositsSection 
            deposits={depositHistory}
            onRefresh={loadDepositHistory}
          />
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
