// src/app/wallet/buyer/page.tsx
'use client';

import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
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
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function BuyerWalletPage() {
  const { user } = useAuth();
  const { 
    getBuyerBalance, 
    setBuyerBalance,
    orderHistory, 
    addDeposit 
  } = useWallet();
  const [balance, setBalance] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletUpdateTrigger, setWalletUpdateTrigger] = useState(0);

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

  // Update balance whenever wallet context changes
  useEffect(() => {
    if (user?.username) {
      const rawBalance = getBuyerBalance(user.username);
      const updatedBalance = Math.max(0, rawBalance);
      setBalance(updatedBalance);
    }
  }, [user, getBuyerBalance, orderHistory, walletUpdateTrigger]);

  // Listen for wallet updates
  useEffect(() => {
    const handleWalletUpdate = () => {
      if (user?.username) {
        const rawBalance = getBuyerBalance(user.username);
        const updatedBalance = Math.max(0, rawBalance);
        setBalance(updatedBalance);
      }
    };

    window.addEventListener('walletUpdate', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletUpdate', handleWalletUpdate);
    };
  }, [user, getBuyerBalance]);

  const handleAddFunds = () => {
    setIsLoading(true);
    const amount = parseFloat(amountToAdd);
    
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

    if (amount > 10000) {
      setMessage('Maximum deposit amount is $10,000. Please contact support for larger deposits.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    try {
      // Simulate a slight delay for better UX
      setTimeout(() => {
        try {
          // Track the deposit first
          const depositSuccess = addDeposit(
            user.username!, 
            roundedAmount, 
            'credit_card', 
            `Wallet deposit by ${user.username}`
          );
          
          if (depositSuccess) {
            // Update local state to reflect the change immediately
            const currentBalance = getBuyerBalance(user.username!);
            const newBalance = currentBalance + roundedAmount;
            setBalance(newBalance);
            
            // Clear form and show success message
            setAmountToAdd('');
            setMessage(`Successfully added $${roundedAmount.toFixed(2)} to your wallet. Your new balance is $${newBalance.toFixed(2)}.`);
            setMessageType('success');
            
            // Trigger wallet update
            setWalletUpdateTrigger(prev => prev + 1);
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmountToAdd(value);
    }
  };

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
        <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white">
          {/* Background Pattern with more subtle opacity */}
          <div className="fixed inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 40% 40%, rgba(124, 58, 237, 0.3) 0%, transparent 50%)`
            }} />
          </div>
          
          <div className="relative z-10 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Premium Header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg shadow-purple-500/10">
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Wallet Dashboard
                  </h1>
                </div>
                <p className="text-gray-400 text-lg">
                  Manage your funds with enterprise-grade security
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Balance Card - More subtle glow */}
                <div className="lg:col-span-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-medium text-gray-300 mb-1">Available Balance</h2>
                        <p className="text-sm text-gray-500">Instant access to your funds</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl backdrop-blur-sm">
                        <DollarSign className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3 mb-6">
                      <span className="text-5xl font-bold text-white tracking-tight">${Math.max(0, balance).toFixed(2)}</span>
                      <span className="text-lg text-gray-400">USD</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                          style={{ width: balance > 0 ? '100%' : '0%' }}
                        />
                      </div>
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    {balance < 20 && balance > 0 && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl flex items-center text-sm text-yellow-400">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        Low balance - top up to continue shopping
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Spent Card - More subtle glow */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-green-500/20 shadow-xl h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-medium text-gray-300 mb-1">Total Spent</h2>
                        <p className="text-sm text-gray-500">Lifetime purchases</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl backdrop-blur-sm">
                        <TrendingUp className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-4xl font-bold text-white tracking-tight">${totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
                      <span className="text-sm text-gray-400">Total Orders</span>
                      <span className="text-lg font-semibold text-white">{buyerPurchases.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Funds Section - More subtle glow */}
              <div className="relative group mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-md opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg shadow-purple-500/10">
                      <PlusCircle className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Add Funds</h2>
                  </div>
                  
                  <div className="mb-6">
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-blue-300 mb-1">SECURE TRANSACTIONS</p>
                          <p className="text-blue-200/80">Instant deposits. Your funds are available immediately.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                          Deposit Amount
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-lg">$</span>
                          </div>
                          <input
                            type="text"
                            id="amount"
                            value={amountToAdd}
                            onChange={handleAmountChange}
                            onKeyPress={handleKeyPress}
                            placeholder="0.00"
                            className="w-full bg-[#0a0a0a] border-2 border-purple-500/30 rounded-xl py-4 pl-10 pr-4 text-xl font-medium text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex gap-3 mt-4">
                          {[25, 50, 100, 200].map((quickAmount) => (
                            <button
                              key={quickAmount}
                              onClick={() => setAmountToAdd(quickAmount.toString())}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white rounded-lg font-medium transition-all duration-200 border border-purple-500/30"
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
                          className="relative group/btn px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center min-w-[220px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                          disabled={isLoading || !amountToAdd || parseFloat(amountToAdd) <= 0}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5 mr-3" />
                              Add Funds
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status message */}
                  {message && (
                    <div className={`p-4 rounded-xl backdrop-blur-sm ${
                      messageType === 'success' ? 'bg-green-900/20 text-green-400 border border-green-500/30' : 
                      messageType === 'error' ? 'bg-red-900/20 text-red-400 border border-red-500/30' : ''
                    }`}>
                      <div className="flex items-center">
                        {messageType === 'success' && <CheckCircle className="w-5 h-5 mr-3" />}
                        {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-3" />}
                        {message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Purchases - More subtle glow */}
              {recentPurchases.length > 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg shadow-purple-500/10">
                          <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Recent Purchases</h2>
                      </div>
                      
                      <a href="/buyers/my-orders" className="group/link flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 hover:text-purple-300 transition-all duration-200">
                        <span className="text-sm font-medium">View All</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                      </a>
                    </div>
                    
                    <div className="space-y-4">
                      {recentPurchases.map((purchase, index) => (
                        <div key={index} className="group/item bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg mb-1 group-hover/item:text-purple-300 transition-colors">{purchase.title}</h3>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400">Seller: <span className="text-purple-400">{purchase.seller}</span></span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">{formatDate(purchase.date)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                ${(purchase.markedUpPrice || purchase.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state - More subtle glow */}
              {buyerPurchases.length === 0 && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-15"></div>
                  <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-12 border border-purple-500/20 shadow-xl text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Start Your Journey</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">Discover exclusive items from our verified sellers. Your first purchase awaits!</p>
                    <a 
                      href="/browse" 
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                      Browse Marketplace
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}