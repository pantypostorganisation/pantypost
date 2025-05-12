'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useState, useEffect } from 'react';

export default function SellerWalletPage() {
  const { user } = useListings();
  const { getSellerBalance, addSellerWithdrawal, sellerWithdrawals } = useWallet();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(0);
  const logs = user ? sellerWithdrawals[user.username] || [] : [];

  // Function to format currency consistently throughout the app
  const formatCurrency = (amount: number): number => {
    // Round to 2 decimal places, consistent with header display
    return Math.round(amount * 100) / 100;
  };

  useEffect(() => {
    if (user?.username) {
      const raw = getSellerBalance(user.username);
      // Use the consistent formatting function
      setBalance(formatCurrency(raw));
    }
  }, [user, getSellerBalance, logs]);

  const handleWithdraw = () => {
    if (!user?.username) {
      setMessage('❌ User not authenticated.');
      return;
    }

    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setMessage('❌ Enter a valid amount.');
        return;
      }

      // Format consistently using the same function
      const formattedAmount = formatCurrency(amount);
      
      // Ensure the amount doesn't exceed available balance with a tiny buffer for floating-point issues
      if (formattedAmount > balance + 0.001) {
        setMessage('❌ Withdrawal exceeds available balance.');
        return;
      }

      // Get the real-time balance directly from the context
      const currentBalance = formatCurrency(getSellerBalance(user.username));
      if (formattedAmount > currentBalance) {
        setMessage('❌ Withdrawal exceeds available balance.');
        return;
      }

      // Always withdraw exactly what the user asked for (after formatting)
      addSellerWithdrawal(user.username, formattedAmount);
      setMessage(`✅ Successfully withdrew $${formattedAmount.toFixed(2)}.`);
      setWithdrawAmount('');
    } catch (error) {
      // Handle any errors from the withdrawal process
      if (error instanceof Error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setMessage('❌ An error occurred during withdrawal.');
      }
      console.error('Withdrawal error:', error);
    }
    
    // Set a timeout to clear the message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Seller Wallet</h1>
        <p className="mb-4">
          Balance:{' '}
          <span className="font-semibold text-pink-700">
            ${balance.toFixed(2)}
          </span>
        </p>

        <div className="mb-4 space-y-2">
          <input
            type="number"
            step="0.01"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            className="w-full border rounded p-2"
            min="0"
            max={balance}
          />
          <button
            onClick={handleWithdraw}
            disabled={balance <= 0}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
          >
            Withdraw Funds
          </button>
        </div>

        {message && (
          <p
            className={`text-sm font-medium ${message.startsWith('✅')
              ? 'text-green-600'
              : 'text-red-500'
              }`}
          >
            {message}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-4 mb-4">
          This reflects your total earnings after the 10% platform fee.
        </p>

        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Withdrawal History</h2>
            <ul className="text-sm space-y-1">
              {logs.map((entry, index) => (
                <li key={index} className="text-gray-700">
                  • Withdrew ${formatCurrency(entry.amount).toFixed(2)} on{' '}
                  {new Date(entry.date).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
