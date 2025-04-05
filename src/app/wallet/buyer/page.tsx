'use client';

import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function BuyerWalletPage() {
  const { buyerBalance } = useListings();

  return (
    <RequireAuth role="buyer">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Buyer Wallet</h1>
        <p className="mb-4">Balance: <span className="font-semibold">${buyerBalance}</span></p>
        <p className="text-sm text-gray-500">Use this wallet to purchase items on PantyPost.</p>
      </main>
    </RequireAuth>
  );
}
