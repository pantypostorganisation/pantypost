'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';

export default function AdminWalletPage() {
  const { adminBalance } = useWallet();
  const { user } = useListings();

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

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
          <span className="font-semibold text-pink-700">
            ${adminBalance.toFixed(2)}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          This shared balance includes 10% taken from each seller and 10% markup charged to buyers.
          Both Oakley and Gerome see the same total.
        </p>
      </main>
    </RequireAuth>
  );
}
