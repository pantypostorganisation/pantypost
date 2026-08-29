// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ChevronDown, Clock, X } from 'lucide-react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import WalletHeader from '@/components/wallet/buyer/WalletHeader';
import AddFundsSection from '@/components/wallet/buyer/AddFundsSection';
import AllDepositsSection from '@/components/wallet/buyer/AllDepositsSection';
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

 /* Card payments are not live yet. Rather than dressing the page in
    warning banners -- which makes a working product look broken -- the
    deposit button intercepts once and explains. Delete this state, the
    modal, and the intercept in onAddFunds when Segpay goes live. */
 const [showPaymentsPending, setShowPaymentsPending] = useState(false);

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
    /* One thing on this page: the card. Everything else is either the
       form attached to it or hidden behind a disclosure underneath.

       Recent Purchases is gone entirely -- purchases are not deposits,
       and /buyers/my-orders already owns them properly. Deposit history
       lives behind "Show recent transactions" so the default view is a
       balance, a card and an amount field.

       (A /* *\/ comment placed directly in JSX children renders as
       literal TEXT -- an earlier version of this page had exactly that
       bug, visible on the live site. Comments must be brace-wrapped.) */
    <main className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <WalletHeader />
        </div>

        {showBanner && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-md border border-success bg-success-soft px-4 py-3 text-sm text-success">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Deposit received. Your wallet has been updated.
          </div>
        )}

        <AddFundsSection
          balance={displayBalance}
          amountToAdd={amountToAdd}
          message={message}
          messageType={messageType}
          isLoading={isLoading}
          onAmountChange={handleAmountChange}
          onKeyPress={handleKeyPress}
          onAddFunds={async () => {
            setShowPaymentsPending(true);
          }}
          onQuickAmountSelect={handleQuickAmountSelect}
        />

        {/* Transactions on demand. Native <details> so it works without
            state, keyboard-accessible for free, and open-by-URL if we
            ever want to deep-link it. */}
        {/* A hairline and a row, not another card. */}
        <details
          className="group mt-8 border-t border-line"
          onToggle={(event) => {
            if ((event.currentTarget as HTMLDetailsElement).open) {
              void loadDepositHistory();
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
            Show recent transactions
            <ChevronDown
              className="h-4 w-4 text-ink-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="pb-4">
            <AllDepositsSection deposits={depositHistory} onRefresh={loadDepositHistory} />
          </div>
        </details>
      </div>

      {showPaymentsPending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payments-pending-title"
          onClick={() => setShowPaymentsPending(false)}
        >
          <div
            className="relative w-full max-w-md rounded-lg border border-white/10 bg-surface-raised p-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowPaymentsPending(false)}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-sm p-1 text-ink-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative mx-auto w-fit">
              <span
                className="absolute inset-0 rounded-full bg-primary/25 blur-2xl"
                aria-hidden="true"
              />
              <Clock
                className="relative h-12 w-12 text-primary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>

            <h2 id="payments-pending-title" className="mt-4 text-xl font-bold text-white">
              Card payments are almost here
            </h2>
            <p className="mt-3 text-sm text-ink-muted">
              We are in the final stages of integrating with Segpay, our payment
              processor, so you can top up your wallet by card. Everything else works
              right now - browse listings, follow sellers and message them directly.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Want to know the moment it goes live?{' '}
              <a href="mailto:support@pantypost.com" className="text-primary hover:underline">
                Email us
              </a>{' '}
              and we will tell you first.
            </p>

            <button
              type="button"
              onClick={() => setShowPaymentsPending(false)}
              className="mt-6 w-full rounded-md bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Got it
            </button>
          </div>
        </div>
      )}
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

