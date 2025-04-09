'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext'; // Assuming useListings includes role and balance
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, role, buyerBalance, sellerBalance, logout } = useListings();
  const [mounted, setMounted] = useState(false);

  // Ensure the component only renders on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      {/* Only render the logo once client-side */}
      <Link href="/" className="text-2xl font-bold">
        {mounted && (
          <img
            src="/logo.png" // Correct path to the logo in the public folder
            alt="PantyPost Logo"
            className="w-48 h-auto" // Increased the width of the logo
          />
        )}
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>

        {/* ✅ Only show if logged in as seller */}
        {mounted && role === 'seller' && (
          <Link href="/sellers/my-listings">My Listings</Link>
        )}

        {/* ✅ Only show if logged in as seller */}
        {mounted && role === 'seller' && (
          <Link href="/wallet/seller">Wallet</Link>
        )}

        {/* ✅ Only show Login if NOT logged in */}
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
