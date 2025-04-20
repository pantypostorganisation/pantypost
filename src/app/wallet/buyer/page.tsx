'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState } from 'react';

export default function BuyerWalletPage() {
  const { user } = useListings();
  const { getBuyerBalance, setBuyerBalance } = useWallet();
  const [balance, setBalance] = useState(0);
  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    if (user?.username) {
      const rawBalance = getBuyerBalance(user.username);
      setBalance(Math.max(0, rawBalance));
    }
  }, [user, getBuyerBalance]);

  const handleAddFunds = () => {
    const amount = parseFloat(amountToAdd);
    if (isNaN(amount) || amount <= 0 || !user?.username) return;

    const newBalance = balance + amount;
    setBuyerBalance(user.username, newBalance);
    setBalance(newBalance);
    setAmountToAdd('');
  };

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">💰 Buyer Wallet</h1>

        <div className="mb-6">
          <p className="text-lg">
            Current Balance:{' '}
            <span className="font-semibold text-pink-700">
              ${Math.max(0, balance).toFixed(2)}
            </span>
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-1">Add Funds</label>
          <input
            type="number"
            step="0.01"
            value={amountToAdd}
            onChange={(e) => setAmountToAdd(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Enter amount (e.g. 10.00)"
          />
          <button
            onClick={handleAddFunds}
            className="w-full bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition"
          >
            Add Funds
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Use your wallet to purchase listings. Each transaction includes a 10% platform fee.
        </p>
      </main>
    </RequireAuth>
  );
}
