'use client';

import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function SellerWalletPage() {
  const { sellerBalance } = useListings();

  return (
    <RequireAuth role="seller">
      <main className="p-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Seller Wallet</h1>
        <p className="mb-4">Balance: <span className="font-semibold">${sellerBalance}</span></p>
        <p className="text-sm text-gray-500">This balance represents your total earnings from sales.</p>
      </main>
    </RequireAuth>
  );
}
