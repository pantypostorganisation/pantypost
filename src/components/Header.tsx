'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useListings } from '@/context/ListingContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, role, buyerBalance, sellerBalance, logout } = useListings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link href="/">
        <Image
          src="/pantypostlogo.png"
          alt="PantyPost Logo"
          width={160}
          height={60}
          className="h-auto w-auto"
        />
      </Link>

      <nav className="flex items-center gap-6 text-sm font-medium">
        <Link href="/browse" className="hover:text-pink-500 transition">Browse</Link>

        {mounted && role === 'seller' && (
          <>
            <Link href="/sellers/my-listings" className="hover:text-pink-500 transition">My Listings</Link>
            <Link href="/wallet/seller" className="hover:text-pink-500 transition">Wallet</Link>
          </>
        )}

        {mounted && role === 'buyer' && (
          <>
            <Link href="/buyers/my-orders" className="hover:text-pink-500 transition">My Orders</Link>
            <Link href="/wallet/buyer" className="hover:text-pink-500 transition">Wallet</Link>
          </>
        )}

        {!user && (
          <Link href="/login" className="hover:text-pink-500 transition">Login</Link>
        )}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">{user} ({role})</span>
            {role === 'buyer' && <span>💰 ${buyerBalance}</span>}
            {role === 'seller' && <span>💼 ${sellerBalance}</span>}
            <button
              onClick={logout}
              className="ml-2 bg-white text-black px-2 py-1 rounded hover:bg-pink-600 hover:text-white transition"
            >
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
