'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, logout } = useListings();
  const { buyerBalance, getSellerBalance, adminBalance } = useWallet();
  const { messages } = useMessages(); // ✅ Must not be conditional
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto" />
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>

        {user?.role === 'seller' && (
          <>
            <Link href="/sellers/my-listings">My Listings</Link>
            <Link href="/sellers/messages">Messages</Link>
          </>
        )}

        {user?.role === 'buyer' && (
          <>
            <Link href="/buyers/my-orders">My Orders</Link>
            <Link href="/buyers/messages">Messages</Link>
            <Link href="/wallet/buyer">Wallet</Link>
          </>
        )}

        {user?.role === 'seller' && (
          <Link href="/wallet/seller">Wallet</Link>
        )}

        {isAdmin && (
          <Link href="/wallet/admin">Admin</Link>
        )}

        {!user && <Link href="/login">Login</Link>}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {user.username} ({user.role})
            </span>

            {user.role === 'buyer' && (
              <span>💰 ${buyerBalance.toFixed(2)}</span>
            )}

            {user.role === 'seller' && (
              <span>💼 ${getSellerBalance(user.username).toFixed(2)}</span>
            )}

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
