// src/app/wallet/buyer/page.tsx
'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useEffect, useState } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  DollarSign, 
  CreditCard, 
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function BuyerWalletPage() {
  const { user } = useListings();
  const { 
    getBuyerBalance, 
    setBuyerBalance, // 🚀 FIX: Import setBuyerBalance to actually update wallet
    orderHistory, 
    addDeposit 
  } = useWallet();
  const [balance, setBalance] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  // Get buyer's purchase history
  const buyerPurchases = user?.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];
  
  // Sort purchases by date (newest first)
  const recentPurchases = [...buyerPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3); // Show only the 3 most recent purchases

  // Calculate total spent
  const totalSpent = buyerPurchases.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

  // 🚀 FIX: Update balance whenever wallet context changes or withdrawals happen
  useEffect(() => {
    if (user?.username) {
      const rawBalance = getBuyerBalance(user.username);
      const updatedBalance = Math.max(0, rawBalance);
      setBalance(updatedBalance);
    }
  }, [user, getBuyerBalance]); // Removed 'logs' dependency as it doesn't exist for buyers

  const handleAddFunds = () => {
    setIsLoading(true);
    const amount = parseFloat(amountToAdd);
    
    // 🚀 FIX: Better validation with more specific error messages
    if (!user?.username) {
      setMessage('You must be logged in to add funds.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount greater than $0.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // 🚀 FIX: Add maximum deposit limit for security
    if (amount > 10000) {
      setMessage('Maximum deposit amount is $10,000. Please contact support for larger deposits.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // 🚀 FIX: Round amount to 2 decimal places to prevent floating point issues
    const roundedAmount = Math.round(amount * 100) / 100;

    try {
      // Simulate a slight delay for better UX
      setTimeout(() => {
        try {
          // 🚀 FIX: Track the deposit first
          const depositSuccess = addDeposit(
            user.username!, 
            roundedAmount, 
            'credit_card', 
            `Wallet deposit by ${user.username}`
          );
          
          if (depositSuccess) {
            // 🚀 FIX: Actually update the buyer's wallet balance in the context
            const currentBalance = getBuyerBalance(user.username!);
            const newBalance = currentBalance + roundedAmount;
            
            // Update the wallet context with the new balance
            setBuyerBalance(user.username!, newBalance);
            
            // Update local state to reflect the change immediately
            setBalance(newBalance);
            
            // Clear form and show success message
            setAmountToAdd('');
            setMessage(`Successfully added $${roundedAmount.toFixed(2)} to your wallet. Your new balance is $${newBalance.toFixed(2)}.`);
            setMessageType('success');
          } else {
            setMessage('Failed to process deposit. Please try again or contact support.');
            setMessageType('error');
          }
        } catch (depositError) {
          console.error('Deposit processing error:', depositError);
          setMessage('An error occurred while processing your deposit. Please try again.');
          setMessageType('error');
        }
        
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Add funds error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setMessageType('error');
      setIsLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // 🚀 FIX: Add input validation for amount field
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmountToAdd(value);
    }
  };

  // 🚀 FIX: Add Enter key support for better UX
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && amountToAdd && !isLoading) {
      handleAddFunds();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-[#ff950e] flex items-center">
                <Wallet className="mr-3 h-8 w-8" />
                Buyer Wallet
              </h1>
              <p className="text-gray-400">
                Manage your funds and view purchase history
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Balance Card */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-300">Current Balance</h2>
                  <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-[#ff950e]" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">${Math.max(0, balance).toFixed(2)}</span>
                  <span className="ml-2 text-sm text-gray-400">USD</span>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  Use your wallet to purchase listings. Each transaction includes a 10% platform fee.
                </p>
                {/* 🚀 FIX: Add low balance warning */}
                {balance < 20 && balance > 0 && (
                  <div className="mt-3 flex items-center text-sm text-yellow-400">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Low balance - consider adding more funds
                  </div>
                )}
              </div>

              {/* Total Spent Card */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-300">Total Spent</h2>
                  <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</span>
                  <span className="ml-2 text-sm text-gray-400">USD</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {buyerPurchases.length} {buyerPurchases.length === 1 ? 'purchase' : 'purchases'} made
                </p>
              </div>
            </div>

            {/* Add Funds Section */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-[#ff950e]" />
                Add Funds
              </h2>
              
              <div className="mb-6">
                {/* 🚀 FIX: Add helpful info about deposits */}
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                      <p className="font-medium mb-1">Instant Deposits</p>
                      <p>Funds are added immediately to your account and available for purchases right away.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                      Amount to add
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="text"
                        id="amount"
                        value={amountToAdd}
                        onChange={handleAmountChange} // 🚀 FIX: Use custom validation
                        onKeyPress={handleKeyPress} // 🚀 FIX: Add Enter key support
                        placeholder="0.00"
                        className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>
                    {/* 🚀 FIX: Add quick amount buttons */}
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 100, 200].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => setAmountToAdd(quickAmount.toString())}
                          className="text-xs px-2 py-1 bg-[#333] hover:bg-[#444] text-gray-300 rounded transition-colors"
                          disabled={isLoading}
                        >
                          ${quickAmount}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddFunds}
                      className="px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] bg-[#ff950e] hover:bg-[#e88800] text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Add Funds
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  messageType === 'success' ? 'bg-green-900 bg-opacity-20 text-green-400 border border-green-500/30' : 
                  messageType === 'error' ? 'bg-red-900 bg-opacity-20 text-red-400 border border-red-500/30' : ''
                }`}>
                  <div className="flex items-center">
                    {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
                    {message}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Purchases */}
            {recentPurchases.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-[#ff950e]" />
                    Recent Purchases
                  </h2>
                  
                  <a href="/buyers/my-orders" className="text-sm text-[#ff950e] hover:text-[#e88800] flex items-center transition-colors">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="space-y-4">
                  {recentPurchases.map((purchase, index) => (
                    <div key={index} className="bg-[#222] rounded-lg p-4 border border-[#333] hover:border-[#444] transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">{purchase.title}</h3>
                          <p className="text-sm text-gray-400">From: {purchase.seller}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(purchase.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#ff950e]">
                            ${(purchase.markedUpPrice || purchase.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🚀 FIX: Add empty state for no purchases */}
            {buyerPurchases.length === 0 && (
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg text-center">
                <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No purchases yet</h3>
                <p className="text-gray-500 mb-4">Start browsing to find amazing items from verified sellers</p>
                <a 
                  href="/browse" 
                  className="inline-flex items-center px-4 py-2 bg-[#ff950e] hover:bg-[#e88800] text-black rounded-lg font-medium transition-colors"
                >
                  Browse Listings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            )}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
