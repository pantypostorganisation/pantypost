'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, logout } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance } = useWallet();
  const { messages } = useMessages();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);

  const role = user?.role ?? null;
  const username = user?.username ?? '';

  const isAdmin = role === 'admin';
  const isBuyer = role === 'buyer' || isAdmin;
  const isSeller = role === 'seller' || isAdmin;

  const buyerBalance =
    username && typeof getBuyerBalance(username) === 'number'
      ? getBuyerBalance(username)
      : 0;

  const sellerBalance =
    username && typeof getSellerBalance(username) === 'number'
      ? getSellerBalance(username)
      : 0;

  const updateReportCount = () => {
    if (typeof window !== 'undefined' && isAdmin) {
      const stored = localStorage.getItem('panty_report_logs');
      const parsed = stored ? JSON.parse(stored) : [];
      setReportCount(parsed.length);
    }
  };

  useEffect(() => {
    setMounted(true);
    updateReportCount();

    window.addEventListener('updateReports', updateReportCount);
    return () => window.removeEventListener('updateReports', updateReportCount);
  }, [user]);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto" />
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>

        {isSeller && (
          <>
            <Link href="/sellers/my-listings">My Listings</Link>
            <Link href="/wallet/seller">Wallet</Link>
          </>
        )}

        {isBuyer && (
          <Link href="/wallet/buyer">Wallet</Link>
        )}

        {isAdmin && (
          <Link href="/admin/reports">
            Reports
            {reportCount > 0 && (
              <span className="ml-1 text-yellow-300">({reportCount})</span>
            )}
          </Link>
        )}

        {!user && (
          <Link href="/login">Login</Link>
        )}

        {user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {username} ({role})
            </span>

            {isBuyer && (
              <span>
                💰 ${typeof buyerBalance === 'number' ? buyerBalance.toFixed(2) : '0.00'}
              </span>
            )}

            {isSeller && (
              <span>
                💼 ${typeof sellerBalance === 'number' ? sellerBalance.toFixed(2) : '0.00'}
              </span>
            )}

            {isAdmin && (
              <span>
                🛠️ ${typeof adminBalance === 'number' ? adminBalance.toFixed(2) : '0.00'}
              </span>
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
