'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useState } from 'react';

export default function AdminWalletPage() {
  const { adminBalance, addAdminWithdrawal, adminWithdrawals } = useWallet();
  const { user } = useListings();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
  const logs = adminWithdrawals;

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('❌ Enter a valid amount.');
      return;
    }
    if (amount > adminBalance) {
      setMessage('❌ Withdrawal exceeds platform balance.');
      return;
    }

    addAdminWithdrawal(amount);
    setMessage(`✅ Withdrew $${amount.toFixed(2)} from platform earnings.`);
    setWithdrawAmount('');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!isAdmin) {
    return (
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600">Only platform admins can view this page.</p>
      </main>
    );
  }

  return (
    <RequireAuth>
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Wallet</h1>
        <p className="mb-4">
          Platform Earnings:{' '}
          <span className="font-semibold text-pink-700">${adminBalance.toFixed(2)}</span>
        </p>

        <div className="mb-4 space-y-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleWithdraw}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded w-full"
            disabled={adminBalance <= 0}
          >
            Withdraw Platform Funds
          </button>
        </div>

        {message && <p className="text-sm font-medium">{message}</p>}

        <p className="text-sm text-gray-500 mt-4 mb-6">
          This shared balance includes 10% taken from each seller and 10% markup charged to buyers.
          Both Oakley and Gerome see the same total.
        </p>

        {logs.length > 0 && (
          <div className="mt-4">
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
