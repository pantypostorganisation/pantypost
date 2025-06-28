// src/app/wallet/seller/page.tsx
'use client';

import { useWallet } from '@/context/WalletContext.enhanced';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

// Import split components
import SellerWalletStats from '@/components/seller/wallet/SellerWalletStats';
import SellerWithdrawForm from '@/components/seller/wallet/SellerWithdrawForm';
import SellerWithdrawHistory from '@/components/seller/wallet/SellerWithdrawHistory';
import SellerWithdrawConfirmModal from '@/components/seller/wallet/SellerWithdrawConfirmModal';

export default function SellerWalletPage() {
  const { user } = useAuth();
  const { getSellerBalance, addSellerWithdrawal, sellerWithdrawals, orderHistory } = useWallet();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const logs = user ? sellerWithdrawals[user.username] || [] : [];
  
  // Sort withdrawals by date (newest first)
  const sortedWithdrawals = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Calculate total withdrawn
  const totalWithdrawn = logs.reduce((sum, log) => sum + log.amount, 0);
  
  // Get seller's sales history
  const sellerSales = user?.username 
    ? orderHistory.filter(order => order.seller === user.username)
    : [];
  
  // Calculate total earnings (including current balance)
  const totalEarnings = balance + totalWithdrawn;

  useEffect(() => {
    if (user?.username) {
      const raw = getSellerBalance(user.username);
      setBalance(parseFloat(raw.toFixed(2)));
    }
  }, [user, getSellerBalance, logs]);

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount.');
      setMessageType('error');
      return;
    }

    const rounded = parseFloat(amount.toFixed(2));
    if (rounded > balance) {
      setMessage('Withdrawal exceeds available balance.');
      setMessageType('error');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmWithdraw = () => {
    setIsLoading(true);
    const amount = parseFloat(withdrawAmount);
    const rounded = parseFloat(amount.toFixed(2));
    
    try {
      if (user && user.username) {
        // Simulate a slight delay for better UX
        setTimeout(() => {
          addSellerWithdrawal(user.username!, rounded);
          setMessage(`Successfully withdrew $${rounded.toFixed(2)}.`);
          setMessageType('success');
          setWithdrawAmount('');
          setShowConfirmation(false);
          setIsLoading(false);
        }, 800);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMessageType('error');
      setIsLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-[#ff950e] flex items-center">
                <Wallet className="mr-3 h-8 w-8" />
                Seller Wallet
              </h1>
              <p className="text-gray-400">
                Manage your earnings and withdrawals
              </p>
            </div>

            <SellerWalletStats
              balance={balance}
              totalEarnings={totalEarnings}
              totalWithdrawn={totalWithdrawn}
              sellerSales={sellerSales}
              logs={logs}
            />

            <SellerWithdrawForm
              balance={balance}
              withdrawAmount={withdrawAmount}
              setWithdrawAmount={setWithdrawAmount}
              message={message}
              messageType={messageType}
              isLoading={isLoading}
              handleWithdrawClick={handleWithdrawClick}
            />

            <SellerWithdrawHistory
              sortedWithdrawals={sortedWithdrawals}
            />
          </div>
        </main>

        <SellerWithdrawConfirmModal
          showConfirmation={showConfirmation}
          setShowConfirmation={setShowConfirmation}
          withdrawAmount={withdrawAmount}
          isLoading={isLoading}
          handleConfirmWithdraw={handleConfirmWithdraw}
        />
      </RequireAuth>
    </BanCheck>
  );
}
