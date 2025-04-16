'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, logout } = useListings();
  const { buyerBalance, getSellerBalance, adminBalance } = useWallet();
  const [mounted, setMounted] = useState(false);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto" />
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>
        {user?.role === 'seller' && <Link href="/sellers/my-listings">My Listings</Link>}
        {user?.role === 'seller' && <Link href="/sellers/messages">Messages</Link>}
        {user?.role === 'buyer' && <Link href="/buyers/my-orders">My Orders</Link>}
        {user?.role === 'buyer' && <Link href="/buyers/messages">Messages</Link>}
        {user?.role === 'buyer' && <Link href="/wallet/buyer">Wallet</Link>}
        {user?.role === 'seller' && <Link href="/wallet/seller">Wallet</Link>}
        {isAdmin && <Link href="/wallet/admin">Admin</Link>}
        {!user && <Link href="/login">Login</Link>}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {user.username} ({user.role})
            </span>

            {/* Show buyer wallet */}
            {user.role === 'buyer' && (
              <span>💰 ${buyerBalance.toFixed(2)}</span>
            )}

            {/* Show seller wallet */}
            {user.role === 'seller' && (
              <span>💼 ${getSellerBalance(user.username).toFixed(2)}</span>
            )}

            {/* Show shared admin wallet only for admins */}
            {isAdmin && (
              <span>🏦 ${adminBalance.toFixed(2)}</span>
            )}

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
