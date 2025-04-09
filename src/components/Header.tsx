'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, role, buyerBalance, sellerBalance, logout } = useListings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      {/* Only render the logo once client-side */}
      <Link href="/" className="text-2xl font-bold">
        {mounted && (
          <img
            src="/logo.png"
            alt="PantyPost Logo"
            className="w-48 h-auto"
          />
        )}
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>

        {/* ✅ Only for buyers */}
        {mounted && role === 'buyer' && (
          <Link href="/buyers/my-orders">My Orders</Link>
        )}

        {mounted && role === 'buyer' && (
          <Link href="/wallet/buyer">Wallet</Link>
        )}

        {/* ✅ Only for sellers */}
        {mounted && role === 'seller' && (
          <Link href="/sellers/my-listings">My Listings</Link>
        )}

        {mounted && role === 'seller' && (
          <Link href="/wallet/seller">Wallet</Link>
        )}

        {/* ✅ Only show Login if not logged in */}
        {mounted && !user && (
          <Link href="/login">Login</Link>
        )}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">{user} ({role})</span>
            {role === 'buyer' && <span>💰 ${buyerBalance}</span>}
            {role === 'seller' && <span>💼 ${sellerBalance}</span>}
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


