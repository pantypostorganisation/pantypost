// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/buyer/WalletHeader';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import AllDepositsSection from '@/components/wallet/buyer/AllDepositsSection';
import RecentPurchases from '@/components/wallet/buyer/RecentPurchases';
import { useBuyerWallet } from '@/hooks/useBuyerWallet';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { apiCall } from '@/services/api.config';

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

 // Load deposit history via the API client so the request is authenticated
 // (the old code read a nonexistent localStorage 'token' key and always sent
 // the request unauthenticated)
 const loadDepositHistory = async () => {
 try {
 const response = await apiCall<unknown[]>('/wallet/deposits/history');
 if (response.success) {
 setDepositHistory(response.data || []);
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
    /* Sized to fit a laptop screen without scrolling.
       Previously: page padding py-8, an 8-unit gap stack, a two-column
       grid with another 8-unit gap, and a full-width deposits panel
       below -- roughly 1400px of content for maybe 700px of viewport.
       Now the deposit form and the two side panels share one row, and
       the vertical rhythm is tighter throughout.

       NOTE: this block previously carried a /* ... *\/ comment sitting
       directly in JSX children, which React renders as literal TEXT --
       that paragraph about crypto was visible on the live page. Comments
       inside JSX must be wrapped in braces, as this one is. */
    <main className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <WalletHeader />
        </div>

        {showBanner && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-md border border-success bg-success-soft px-4 py-3 text-sm text-success">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Deposit received. Your wallet has been updated.
          </div>
        )}

        {/* Deposit form takes the width it needs; the supporting panels
            stack beside it instead of below. */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
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

          <div className="flex min-w-0 flex-col gap-5">
            <RecentPurchases purchases={recentPurchases} />
            <AllDepositsSection deposits={depositHistory} onRefresh={loadDepositHistory} />
          </div>
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
 <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
 <div
 className="w-4 h-4 rounded-full bg-primary animate-pulse"
 style={{ animationDelay: '0.2s' }}
 ></div>
 <div
 className="w-4 h-4 rounded-full bg-primary animate-pulse"
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