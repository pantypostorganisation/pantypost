'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function Header() {
  const { user, logout, sellerNotifications, clearSellerNotification } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance } = useWallet();
  const { messages } = useMessages();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

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

      <nav className="flex items-center gap-6 relative">
        <Link href="/browse">Browse</Link>

        {mounted && isAdmin && (
          <>
            <Link href="/admin/reports">Reports</Link>
            <Link href="/admin/resolved">Resolved</Link>
            <Link href="/admin/messages">Messages</Link>
            <Link href="/wallet/admin">Admin Wallet</Link>
            <span>🛠️ ${adminBalance.toFixed(2)}</span>
          </>
        )}

        {mounted && role === 'seller' && (
          <>
            <Link href="/sellers/my-listings">My Listings</Link>
            <Link href="/sellers/profile">Profile</Link>
            <Link href="/wallet/seller">Wallet</Link>
            <Link href="/sellers/messages">Messages</Link>
            <Link href="/sellers/subscribers">Subscribers</Link>
            <span>💼 ${Math.max(sellerBalance, 0).toFixed(2)}</span>

            {/* 🔔 Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative"
              >
                <Bell className="w-6 h-6" />
                {sellerNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                    {sellerNotifications.length}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded shadow-lg z-50">
                  <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                    {sellerNotifications.length === 0 ? (
                      <li className="p-3 text-sm text-center text-gray-500">No notifications</li>
                    ) : (
                      sellerNotifications.map((note, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center p-3 text-sm"
                        >
                          <span className="text-gray-800">{note}</span>
                          <button
                            onClick={() => clearSellerNotification(i)}
                            className="text-xs text-red-500 hover:underline ml-2"
                          >
                            Clear
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {mounted && role === 'buyer' && (
          <>
            <Link href="/buyers/dashboard">Dashboard</Link>
            <Link href="/buyers/my-orders">My Orders</Link>
            <Link href="/wallet/buyer">Wallet</Link>
            <Link href="/buyers/messages">Messages</Link>
            <span>💰 ${buyerBalance.toFixed(2)}</span>
          </>
        )}

        {!user && <Link href="/login">Login</Link>}

        {mounted && user && (
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {username} ({role})
            </span>
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
