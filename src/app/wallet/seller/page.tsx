'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function SellerWalletPage() {
  const { user } = useListings();
  const { getSellerBalance } = useWallet();

  const balance = user ? getSellerBalance(user.username) : 0;

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
        <p className="text-sm text-gray-500">
          This is your total earnings from successful sales.
          A 10% platform fee has already been deducted from each transaction.
        </p>
      </main>
    </RequireAuth>
  );
}
