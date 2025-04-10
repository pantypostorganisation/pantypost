'use client';

import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';

export default function SellerWalletPage() {
  const { sellerBalance } = useWallet();

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Seller Wallet</h1>
        <p className="mb-4">
          Balance: <span className="font-semibold">${sellerBalance.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-500">
          This is your total earnings from successful sales.
          A 10% platform fee has already been deducted from each transaction.
        </p>
      </main>
    </RequireAuth>
  );
}
