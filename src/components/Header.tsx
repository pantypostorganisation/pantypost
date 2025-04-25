'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ShoppingBag,
  Wallet,
  MessageSquare,
  Users,
  User,
  LogOut,
  Package,
} from 'lucide-react';

export default function Header() {
  const { user, logout, sellerNotifications, clearSellerNotification, listings } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance, orderHistory } = useWallet();
  const { messages } = useMessages();
  const { getRequestsForUser } = useRequests();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
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

  useEffect(() => {
    if (user && user.role === 'seller') {
      const sales = orderHistory.filter((order) => order.seller === user.username);
      const requests = getRequestsForUser(user.username, 'seller');
      const acceptedCustoms = requests.filter((req) => req.status === 'accepted');
      setPendingOrdersCount(sales.length + acceptedCustoms.length);
    }
  }, [user, orderHistory, getRequestsForUser]);

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
    <header className="bg-black text-white shadow-lg border-b border-[#222] px-8 py-3 flex justify-between items-center z-50 relative">
      <Link href="/" className="flex items-center gap-3">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto drop-shadow-lg" />
      </Link>

      <nav className="flex items-center gap-2 relative">
        <Link href="/browse" className="flex items-center gap-1 text-white hover:text-primary text-xs px-2 py-1 rounded transition">
          <ShoppingBag className="w-4 h-4" />
          <span>Browse</span>
        </Link>

        {mounted && role === 'seller' && (
          <>
            <Link href="/sellers/my-listings" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">My Listings</Link>
            <Link href="/sellers/profile" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">Profile</Link>
            <Link href="/wallet/seller" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/sellers/messages" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link href="/sellers/subscribers" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <Users className="w-4 h-4" />
            </Link>
            {/* Orders to Fulfil - Prominent button with badge */}
            <div className="relative flex items-center">
              <Link
                href="/sellers/orders-to-fulfil"
                className="flex items-center bg-primary hover:bg-primary-dark text-black text-xs font-semibold px-4 pr-8 py-1.5 rounded-full shadow transition border border-white"
                style={{ minWidth: 0, minHeight: 0 }}
              >
                <Package className="w-4 h-4 mr-2" />
                <span className="font-semibold text-white">Orders to Fulfil</span>
              </Link>
              {pendingOrdersCount > 0 && (
                <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-[#ff950e] text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            {/* Notification Bell - large, white, always visible */}
            <div className="relative flex items-center" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className="relative flex items-center justify-center w-10 h-10 bg-[#ff950e] border border-white rounded-full shadow hover:scale-105 transition"
              >
                <Bell className="w-5 h-5 text-white" />
                {filteredNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-[#ff950e] text-[10px] rounded-full px-1 py-0.5 min-w-[14px] text-center border-2 border-[#ff950e] font-bold">
                    {filteredNotifications.length}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-card text-white rounded-xl shadow-2xl z-50 border border-[#333]">
                  <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <li className="p-3 text-sm text-center text-gray-400">No notifications</li>
                    ) : (
                      filteredNotifications.map((note, i) => (
                        <li key={i} className="flex justify-between items-start p-3 text-sm hover:bg-[#222] transition">
                          <span className="text-gray-200 leading-snug">{note}</span>
                          <button
                            onClick={() => {
                              const origIndex = sellerNotifications.indexOf(note);
                              if (origIndex !== -1) clearSellerNotification(origIndex);
                            }}
                            className="text-xs text-primary hover:text-primary-light ml-2 font-bold"
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
            <Link href="/buyers/dashboard" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">Dashboard</Link>
            <Link href="/buyers/my-orders" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">My Orders</Link>
            <Link href="/wallet/buyer" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${buyerBalance.toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/buyers/messages" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <MessageSquare className="w-4 h-4" />
            </Link>
          </>
        )}

        {!user && (
          <Link
            href="/login"
            className="bg-primary hover:bg-primary-dark text-white text-xs px-3 py-1 rounded-full transition font-bold shadow-lg"
          >
            Login
          </Link>
        )}

        {mounted && user && (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-primary font-bold flex items-center gap-1 bg-card px-2 py-0.5 rounded-full shadow text-xs">
              <User className="w-4 h-4" />
              {username} <span className="text-gray-400 text-xs">({role})</span>
            </span>
            <button
              onClick={logout}
              className="bg-card hover:bg-[#222] text-white px-3 py-[6px] rounded-full flex items-center gap-1 text-xs font-semibold border border-[#333] transition"
              style={{ height: '30px' }}
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
