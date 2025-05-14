'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useState, useRef, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowDownCircle, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown
} from 'lucide-react';

export default function AdminWalletPage() {
  const { adminBalance, addAdminWithdrawal, adminWithdrawals, adminActions } = useWallet();
  const { user } = useListings();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
  const logs = adminWithdrawals;

  // Calculate total withdrawn
  const totalWithdrawn = logs.reduce((sum, log) => sum + log.amount, 0);
  
  // Sort withdrawals by date (newest first)
  const sortedWithdrawals = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get only the last 4 withdrawals for initial display
  const recentWithdrawals = sortedWithdrawals.slice(0, 4);

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount.');
      setMessageType('error');
      return;
    }
    if (amount > adminBalance) {
      setMessage('Withdrawal exceeds available balance.');
      setMessageType('error');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmWithdraw = () => {
    setIsLoading(true);
    const amount = parseFloat(withdrawAmount);
    
    try {
      addAdminWithdrawal(amount);
      setMessage(`Successfully withdrew $${amount.toFixed(2)} from platform earnings.`);
      setMessageType('success');
      setWithdrawAmount('');
      setShowConfirmation(false);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  const toggleHistoryView = () => {
    setShowAllHistory(!showAllHistory);
  };

  // Scroll to bottom of history when showing all
  useEffect(() => {
    if (showAllHistory && historyContainerRef.current) {
      setTimeout(() => {
        historyContainerRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showAllHistory]);

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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#121212] text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-[#333]">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
          <p className="text-gray-400 text-center">
            Only platform administrators can view this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[#ff950e]">Admin Wallet Dashboard</h1>
            <p className="text-gray-400">
              Manage platform earnings and withdrawals
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Current Balance */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-300">Current Balance</h2>
                <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-[#ff950e]" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">${adminBalance.toFixed(2)}</span>
                <span className="ml-2 text-sm text-gray-400">USD</span>
              </div>
            </div>

            {/* Total Withdrawn */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-300">Total Withdrawn</h2>
                <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                  <ArrowDownCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">${totalWithdrawn.toFixed(2)}</span>
                <span className="ml-2 text-sm text-gray-400">USD</span>
              </div>
            </div>

            {/* Last Withdrawal */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-300">Last Withdrawal</h2>
                <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              {sortedWithdrawals.length > 0 ? (
                <div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-white">
                      ${sortedWithdrawals[0].amount.toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-gray-400">USD</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(sortedWithdrawals[0].date)}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No withdrawals yet</p>
              )}
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <ArrowDownCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
              Withdraw Funds
            </h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-4">
                This shared balance includes 10% taken from each seller and 10% markup charged to buyers.
                Both Oakley and Gerome see the same total.
              </p>
              
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
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                      disabled={adminBalance <= 0}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleWithdrawClick}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] ${
                      adminBalance <= 0
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#ff950e] hover:bg-[#e88800] text-black'
                    }`}
                    disabled={adminBalance <= 0 || isLoading}
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
                  {messageType === 'error' && <XCircle className="w-5 h-5 mr-2" />}
                  {message}
                </div>
              </div>
            )}
          </div>

          {/* Withdrawal History */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Clock className="w-5 h-5 mr-2 text-[#ff950e]" />
                Withdrawal History
              </h2>
              
              {sortedWithdrawals.length > 4 && (
                <button 
                  onClick={toggleHistoryView}
                  className="flex items-center text-sm text-[#ff950e] hover:text-[#e88800] transition-colors"
                >
                  {showAllHistory ? 'Show Recent' : 'Show All'}
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            
            {sortedWithdrawals.length > 0 ? (
              <div 
                ref={historyContainerRef}
                className={`overflow-y-auto ${showAllHistory ? 'max-h-96' : ''}`}
                style={{ scrollBehavior: 'smooth' }}
              >
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#1a1a1a] z-10">
                    <tr className="text-left text-gray-400 text-sm border-b border-[#333]">
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {(showAllHistory ? sortedWithdrawals : recentWithdrawals).map((withdrawal, index) => (
                      <tr key={index} className="text-gray-300">
                        <td className="py-4 font-medium">${withdrawal.amount.toFixed(2)}</td>
                        <td className="py-4 text-gray-400">{formatDate(withdrawal.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No withdrawal history found</p>
              </div>
            )}
          </div>
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
  );
}
