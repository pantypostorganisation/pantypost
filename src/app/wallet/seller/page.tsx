// src/app/wallet/seller/page.tsx
'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  DollarSign, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export default function SellerWalletPage() {
  const { user } = useListings();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Current Balance */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-300">Available Balance</h2>
                  <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-[#ff950e]" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">${balance.toFixed(2)}</span>
                  <span className="ml-2 text-sm text-gray-400">USD</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Available for withdrawal
                </p>
              </div>

              {/* Total Earnings */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-300">Total Earnings</h2>
                  <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">${totalEarnings.toFixed(2)}</span>
                  <span className="ml-2 text-sm text-gray-400">USD</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {sellerSales.length} {sellerSales.length === 1 ? 'sale' : 'sales'} completed
                </p>
              </div>

              {/* Total Withdrawn */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-300">Total Withdrawn</h2>
                  <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                    <ArrowDownCircle className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">${totalWithdrawn.toFixed(2)}</span>
                  <span className="ml-2 text-sm text-gray-400">USD</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {logs.length} {logs.length === 1 ? 'withdrawal' : 'withdrawals'} made
                </p>
              </div>
            </div>

            {/* Withdrawal Form */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
                Withdraw Funds
              </h2>
              
              <div className="mb-6">
                <div className="flex items-center mb-4 p-3 bg-[#222] rounded-lg border border-[#444] text-sm text-gray-300">
                  <Info className="w-5 h-5 mr-2 text-[#ff950e]" />
                  <p>This reflects your total earnings after the 10% platform fee.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                      Amount to withdraw
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        step="0.01"
                        min="0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                        disabled={balance <= 0}
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleWithdrawClick}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] ${
                        balance <= 0
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-[#ff950e] hover:bg-[#e88800] text-black'
                      }`}
                      disabled={balance <= 0 || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-5 h-5 mr-2" />
                          Withdraw Funds
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  messageType === 'success' ? 'bg-green-900 bg-opacity-20 text-green-400' : 
                  messageType === 'error' ? 'bg-red-900 bg-opacity-20 text-red-400' : ''
                }`}>
                  <div className="flex items-center">
                    {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
                    {message}
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal History */}
            {sortedWithdrawals.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-[#ff950e]" />
                  Withdrawal History
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-[#333]">
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                      {sortedWithdrawals.map((withdrawal, index) => (
                        <tr key={index} className="text-gray-300">
                          <td className="py-4 font-medium">${withdrawal.amount.toFixed(2)}</td>
                          <td className="py-4 text-gray-400">{formatDate(withdrawal.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-[#333] shadow-xl">
              <h3 className="text-xl font-bold mb-4">Confirm Withdrawal</h3>
              <p className="mb-6 text-gray-300">
                Are you sure you want to withdraw <span className="font-bold text-white">${parseFloat(withdrawAmount).toFixed(2)}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmWithdraw}
                  className="flex-1 px-4 py-2 bg-[#ff950e] hover:bg-[#e88800] text-black rounded-lg font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </RequireAuth>
    </BanCheck>
  );
}
