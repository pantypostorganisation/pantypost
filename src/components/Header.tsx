'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext'; // Import useWallet for wallet balance
import { useListings } from '@/context/ListingContext'; // Import useListings for user and role info
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, role, logout } = useListings(); // Use ListingsContext for user and role
  const { buyerBalance, sellerBalance } = useWallet(); // Use WalletContext for wallet balance
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold">
        {mounted && (
          <img
            src="/logo.png" // Assuming the logo is placed in the public directory
            alt="PantyPost Logo"
            className="w-24 h-auto"
          />
        )}
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>
        {role === 'seller' && <Link href="/sellers/my-listings">My Listings</Link>}
        {role === 'buyer' && <Link href="/buyers/my-orders">My Orders</Link>} {/* Only show My Orders for buyers */}
        {role === 'buyer' && <Link href="/wallet/buyer">Wallet</Link>} {/* Only show wallet for buyers */}
        {role === 'seller' && <Link href="/wallet/seller">Wallet</Link>} {/* Only show wallet for sellers */}
        <Link href="/login">Login</Link>

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">{user} ({role})</span>
            {role === 'buyer' && <span>💰 ${buyerBalance}</span>} {/* Display buyer balance */}
            {role === 'seller' && <span>💼 ${sellerBalance}</span>} {/* Display seller balance */}
            <button
              onClick={logout}
              className="ml-2 bg-white text-pink-600 px-2 py-1 rounded"
            >
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
