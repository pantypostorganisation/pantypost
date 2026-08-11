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
 <main className="relative min-h-screen overflow-hidden bg-surface text-white">
 <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-10">
 <div className="mx-auto flex max-w-6xl flex-col gap-8">
 <WalletHeader />
 {/* success banner after crypto redirect */}
 {showBanner && (
 <div className="flex items-center justify-center gap-2 rounded-md border border-success bg-success-soft p-4 text-center text-success">
 <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
 Deposit received. Your wallet has been updated.
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

 /* Crypto removed. Card via SegPay is the funding route now,
 and the crypto column was three competing choices deep --
 a method toggle, then six coin options, each with its own
 green"CHEAPEST" badge -- next to a single, calm card form.
 The components still exist on disk if it ever comes back. */
 <div className="flex flex-col gap-6">
 <RecentPurchases purchases={recentPurchases} />
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