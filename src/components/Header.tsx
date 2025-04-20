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

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
  const role = user?.role ?? null;
  const username = user?.username ?? '';

  const buyerBalance =
    typeof getBuyerBalance(username) === 'number' ? getBuyerBalance(username) : 0;
  const sellerBalance =
    typeof getSellerBalance(username) === 'number' ? getSellerBalance(username) : 0;

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
  }, []);

  return (
    <header className="bg-pink-600 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto" />
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/browse">Browse</Link>

        {/* ✅ Admin-only tabs */}
        {mounted && isAdmin && (
          <>
            <Link href="/admin/reports">Reports</Link>
            <Link href="/admin/resolved">Resolved</Link>
            <Link href="/admin/messages">Messages</Link>
            <Link href="/wallet/admin">Admin Wallet</Link>
            <span>🛠️ ${adminBalance.toFixed(2)}</span>
          </>
        )}

        {/* ✅ Seller-only tabs */}
        {mounted && role === 'seller' && (
          <>
            <Link href="/sellers/my-listings">My Listings</Link>
            <Link href="/sellers/profile">Profile</Link> {/* ✅ restored */}
            <Link href="/wallet/seller">Wallet</Link>
            <Link href="/sellers/messages">Messages</Link>
          </>
        )}

        {/* ✅ Buyer-only tabs */}
        {mounted && role === 'buyer' && (
          <>
            <Link href="/buyers/dashboard">Dashboard</Link> {/* ✅ added */}
            <Link href="/buyers/my-orders">My Orders</Link> {/* ✅ added */}
            <Link href="/wallet/buyer">Wallet</Link>
            <Link href="/buyers/messages">Messages</Link>
          </>
        )}

        {!user && <Link href="/login">Login</Link>}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {username} ({role})
            </span>

            {role === 'buyer' && (
              <span>💰 ${buyerBalance.toFixed(2)}</span>
            )}
            {role === 'seller' && (
              <span>💼 ${sellerBalance.toFixed(2)}</span>
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
