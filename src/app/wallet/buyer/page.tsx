'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
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
    setBuyerBalance, 
    orderHistory, 
    addDeposit // 🚀 ADD: Import the deposit tracking function
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

  useEffect(() => {
    if (user?.username) {
      const rawBalance = getBuyerBalance(user.username);
      setBalance(Math.max(0, rawBalance));
    }
  }, [user, getBuyerBalance]);

  const handleAddFunds = () => {
    setIsLoading(true);
    const amount = parseFloat(amountToAdd);
    
    if (isNaN(amount) || amount <= 0 || !user?.username) {
      setMessage('Please enter a valid amount.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate a slight delay for better UX
      setTimeout(() => {
        // 🚀 NEW: Use the deposit tracking system instead of direct balance update
        const success = addDeposit(user.username!, amount, 'credit_card', `Wallet deposit by ${user.username}`);
        
        if (success) {
          // Update local balance state
          const newBalance = balance + amount;
          setBalance(newBalance);
          setAmountToAdd('');
          setMessage(`Successfully added $${amount.toFixed(2)} to your wallet.`);
          setMessageType('success');
        } else {
          setMessage('An error occurred while adding funds.');
          setMessageType('error');
        }
        setIsLoading(false);
      }, 800);
    } catch (error) {
      setMessage('An error occurred while adding funds.');
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
      day: 'numeric' 
    });
  };

  return (
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
                      type="number"
                      id="amount"
                      step="0.01"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#222] border border-[#444] rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddFunds}
                    className="px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[180px] bg-[#ff950e] hover:bg-[#e88800] text-black"
                    disabled={isLoading}
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

          {/* Recent Purchases */}
          {recentPurchases.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-[#ff950e]" />
                  Recent Purchases
                </h2>
                
                <a href="/buyers/my-orders" className="text-sm text-[#ff950e] hover:text-[#e88800] flex items-center">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </div>
              
              <div className="space-y-4">
                {recentPurchases.map((purchase, index) => (
                  <div key={index} className="bg-[#222] rounded-lg p-4 border border-[#333]">
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
        </div>
      </main>
    </RequireAuth>
  );
}
