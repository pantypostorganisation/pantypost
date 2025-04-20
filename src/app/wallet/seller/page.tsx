'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useState } from 'react';

export default function SellerWalletPage() {
  const { user } = useListings();
  const { getSellerBalance, addSellerWithdrawal, sellerWithdrawals } = useWallet();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');

  const balanceRaw = user ? getSellerBalance(user.username) : 0;
  const balance = parseFloat(balanceRaw.toFixed(2)); // ✅ round to 2 decimals
  const logs = user ? sellerWithdrawals[user.username] || [] : [];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('❌ Enter a valid amount.');
      return;
    }

    const roundedAmount = parseFloat(amount.toFixed(2)); // ✅ round to match balance

    if (roundedAmount > balance) {
      setMessage('❌ Withdrawal exceeds balance.');
      return;
    }

    addSellerWithdrawal(user!.username, roundedAmount);
    setMessage(`✅ Successfully withdrew $${roundedAmount.toFixed(2)}.`);
    setWithdrawAmount('');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Seller Wallet</h1>
        <p className="mb-4">
          Balance: <span className="font-semibold text-pink-700">${balance.toFixed(2)}</span>
        </p>

        <div className="mb-4 space-y-2">
          <input
            type="number"
            step="0.01"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleWithdraw}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            disabled={balance <= 0}
          >
            Withdraw Funds
          </button>
        </div>

        {message && <p className="text-sm font-medium">{message}</p>}

        <p className="text-sm text-gray-500 mt-4 mb-4">
          This is your total earnings from successful sales.
          A 10% platform fee has already been deducted from each transaction.
        </p>

        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Withdrawal History</h2>
            <ul className="text-sm space-y-1">
              {logs.map((entry, index) => (
                <li key={index} className="text-gray-300">
                  • Withdrew ${entry.amount.toFixed(2)} on {new Date(entry.date).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
