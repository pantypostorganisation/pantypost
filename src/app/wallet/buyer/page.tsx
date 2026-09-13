// src/app/wallet/buyer/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ChevronDown, Clock, X } from 'lucide-react';
import CryptoTopUpModal from '@/components/wallet/buyer/CryptoTopUpModal';
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

 /* Crypto is the live deposit rail while card acquiring is still
    being arranged. The modal handles both kinds of buyer: those who
    already hold crypto, and those who need telling how to get some. */
 const [showCrypto, setShowCrypto] = useState(false);
 const [cryptoConfig, setCryptoConfig] = useState<{
   currencies: { code: string; label: string; network: string; note: string }[];
   min: number;
   max: number;
   enabled: boolean;
 } | null>(null);

 useEffect(() => {
   let cancelled = false;
   (async () => {
     try {
       const res = await apiCall<any>('/wallet/crypto/currencies');
       if (!cancelled && res.success) setCryptoConfig(res.data);
     } catch {
       // Leaving this null just hides the option rather than breaking
       // the page.
     }
   })();
   return () => { cancelled = true; };
 }, []);

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
            setShowCrypto(true);
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

      {cryptoConfig?.enabled && (
        <CryptoTopUpModal
          open={showCrypto}
          onClose={() => setShowCrypto(false)}
          currencies={cryptoConfig.currencies}
          min={cryptoConfig.min}
          max={cryptoConfig.max}
          onCreate={async (value, currency) => {
            const res = await apiCall<any>('/wallet/crypto/create', {
              method: 'POST',
              body: JSON.stringify({ amount: value, currency }),
            });
            if (!res.success) {
              /* res.error is an ApiError object, not a string -- passing
                 it straight to Error() gives "[object Object]" on screen
                 as well as a type error. */
              const message =
                typeof res.error === 'string'
                  ? res.error
                  : res.error?.message || 'Could not start the deposit.';
              throw new Error(message);
            }
            return res.data;
          }}
          onCheckStatus={async (paymentId) => {
            const res = await apiCall<any>(`/wallet/crypto/status/${paymentId}`);
            if (!res.success) throw new Error('Could not check the deposit.');
            return res.data;
          }}
          onCredited={() => {
            void reloadData();
          }}
        />
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



