'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useEffect, useRef, useState } from 'react';
import { Bell, ShoppingBag, Wallet, MessageSquare, Users, User, LogOut, Settings, BarChart2, ClipboardList } from 'lucide-react';

export default function Header() {
  const { user, logout, sellerNotifications, clearSellerNotification, listings } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance } = useWallet();
  const { messages } = useMessages();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';
  const role = user?.role ?? null;
  const username = user?.username ?? '';

  const [filteredNotifications, setFilteredNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (user && user.role === 'seller') {
      const filtered = sellerNotifications.filter(notif => {
        if (notif.includes('purchased:')) {
          const itemMatch = notif.match(/purchased: ["']?([^"']+)["']?/);
          if (!itemMatch) return false;
          const itemTitle = itemMatch[1].trim();
          const sellerHasItem = listings.some(listing => listing.seller === user.username && listing.title === itemTitle);
          return sellerHasItem;
        }
        if (notif.includes('subscriber:') || notif.includes('subscribed')) {
          return notif.toLowerCase().includes(user.username.toLowerCase());
        }
        return notif.toLowerCase().includes(user.username.toLowerCase());
      });
      setFilteredNotifications(filtered);
    } else {
      setFilteredNotifications([]);
    }
  }, [user, sellerNotifications, listings]);

  const buyerBalance = typeof getBuyerBalance(username) === 'number' ? getBuyerBalance(username) : 0;
  const sellerBalance = typeof getSellerBalance(username) === 'number' ? getSellerBalance(username) : 0;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-black text-white shadow-md border-b border-[#1a1a1a] px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold flex items-center gap-2">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto" />
      </Link>

      <nav className="flex items-center gap-6 relative">
        <Link href="/browse" className="text-white hover:text-[#ff950e] transition flex items-center gap-1">
          <ShoppingBag className="w-4 h-4" />
          <span>Browse</span>
        </Link>

        {mounted && isAdmin && (
          <>
            <Link href="/admin/reports" className="text-white hover:text-[#ff950e] transition">
              Reports {reportCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{reportCount}</span>}
            </Link>
            <Link href="/admin/resolved" className="text-white hover:text-[#ff950e] transition">Resolved</Link>
            <Link href="/admin/messages" className="text-white hover:text-[#ff950e] transition">Messages</Link>
            <Link href="/wallet/admin" className="text-white hover:text-[#ff950e] transition">Admin Wallet</Link>
            <span className="text-[#ff950e] font-semibold">${adminBalance.toFixed(2)}</span>
          </>
        )}

        {mounted && role === 'seller' && (
          <>
            <Link href="/sellers/my-listings" className="text-white hover:text-[#ff950e] transition">My Listings</Link>
            <Link href="/sellers/profile" className="text-white hover:text-[#ff950e] transition">Profile</Link>
            <Link href="/wallet/seller" className="text-white hover:text-[#ff950e] transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/sellers/messages" className="text-white hover:text-[#ff950e] transition">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link href="/sellers/subscribers" className="text-white hover:text-[#ff950e] transition">
              <Users className="w-5 h-5" />
            </Link>
            {/* Removed Custom Requests link for sellers */}
            {/* <Link href="/sellers/requests" className="text-white hover:text-[#ff950e] transition">
              <ClipboardList className="w-5 h-5" />
            </Link> */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className="relative hover:text-[#ff950e] transition"
              >
                <Bell className="w-5 h-5" />
                {filteredNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#ff950e] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {filteredNotifications.length}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1a1a1a] text-white rounded shadow-lg z-50 border border-[#333]">
                  <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <li className="p-3 text-sm text-center text-gray-400">No notifications</li>
                    ) : (
                      filteredNotifications.map((note, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-start p-3 text-sm hover:bg-[#222]"
                        >
                          <span className="text-gray-200 leading-snug">
                            {note}
                          </span>
                          <button
                            onClick={() => {
                              const origIndex = sellerNotifications.indexOf(note);
                              if (origIndex !== -1) {
                                clearSellerNotification(origIndex);
                              }
                            }}
                            className="text-xs text-[#ff950e] hover:text-[#e0850d] ml-2"
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
            <Link href="/buyers/dashboard" className="text-white hover:text-[#ff950e] transition">Dashboard</Link>
            <Link href="/buyers/my-orders" className="text-white hover:text-[#ff950e] transition">My Orders</Link>
            {/* Removed Custom Requests link for buyers */}
            {/* <Link href="/buyers/requests" className="text-white hover:text-[#ff950e] transition">Custom Requests</Link> */}
            <Link href="/wallet/buyer" className="text-white hover:text-[#ff950e] transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${buyerBalance.toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/buyers/messages" className="text-white hover:text-[#ff950e] transition">
              <MessageSquare className="w-5 h-5" />
            </Link>
          </>
        )}

        {!user && (
          <Link 
            href="/login" 
            className="bg-[#ff950e] hover:bg-[#e0850d] text-white px-4 py-1.5 rounded-full transition font-medium"
          >
            Login
          </Link>
        )}

        {mounted && user && (
          <div className="flex items-center gap-3">
            <span className="text-[#ff950e] font-semibold flex items-center gap-1">
              <User className="w-4 h-4" />
              {username} <span className="text-gray-400 text-xs">({role})</span>
            </span>
            <button
              onClick={logout}
              className="bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm"
            >
              <LogOut className="w-3 h-3" />
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
