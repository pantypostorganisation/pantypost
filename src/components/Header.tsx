'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages, getReportCount } from '@/context/MessageContext';
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
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';

export default function Header() {
  const { user, logout, sellerNotifications, clearSellerNotification, listings } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance, orderHistory } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { messages } = useMessages();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdminUser = user?.username === 'oakley' || user?.username === 'gerome';
  const role = user?.role ?? null;
  const username = user?.username ?? '';

  const notifications = user?.role === 'seller' ? sellerNotifications || [] : [];

  const unreadMessages = user?.username
    ? Object.values(messages)
      .flat()
      .filter(
        (msg) =>
          (msg.receiver === user.username || msg.sender === user.username) &&
          msg.read === false
      )
    : [];
  const unreadCount = unreadMessages.length;

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
    if (typeof window !== 'undefined' && isAdminUser) {
      setReportCount(getReportCount());
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    updateReportCount();
    window.addEventListener('updateReports', updateReportCount);

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('updateReports', updateReportCount);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user?.username]);

  return (
    <header className="bg-black text-white shadow-lg px-8 py-3 flex justify-between items-center z-50 relative">
      <Link href="/" className="flex items-center gap-3">
        <img src="/logo.png" alt="PantyPost Logo" className="w-24 h-auto drop-shadow-lg" />
      </Link>

      <nav className="flex items-center gap-x-4">
        <Link href="/browse" className="flex items-center gap-1 text-white hover:text-primary text-xs px-2 py-1 rounded transition">
          <ShoppingBag className="w-4 h-4" />
          <span>Browse</span>
        </Link>

        {mounted && isAdminUser && (
          <>
            <div className="relative flex items-center min-w-[60px]">
              <Link
                href="/admin/reports"
                className="block text-white hover:text-primary text-xs px-2 py-1 rounded transition pr-6"
                style={{ position: 'relative', zIndex: 10 }}
              >
                Reports
                {reportCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ff950e] text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow z-50 pointer-events-none">
                    {reportCount}
                  </span>
                )}
              </Link>
            </div>
            <Link href="/admin/resolved" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              Resolved
            </Link>
            <Link href="/admin/messages" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              Messages
            </Link>
            <Link href="/admin/verification-requests" className="flex items-center text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <ClipboardCheck className="w-4 h-4 mr-1" />
              Review Verifications
            </Link>
            <Link href="/wallet/admin" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              Admin Wallet
            </Link>
            <span className="text-primary font-bold text-xs">${adminBalance.toFixed(2)}</span>
          </>
        )}

        {mounted && role === 'seller' && !isAdminUser && (
          <>
            <Link href="/sellers/my-listings" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">My Listings</Link>
            <Link href="/sellers/profile" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">Profile</Link>
            <Link href="/sellers/verify" className="flex items-center text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Get Verified
            </Link>
            <Link href="/wallet/seller" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/sellers/messages" className="relative text-white hover:text-primary text-xs px-2 py-1 rounded transition flex items-center">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-2 bg-white text-[#ff950e] text-[10px] rounded-full flex items-center justify-center"
                  style={{
                    width: '18px',
                    height: '18px',
                    fontWeight: 700,
                    border: '2px solid #ff950e',
                    zIndex: 2,
                    fontSize: '11px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/sellers/subscribers" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <Users className="w-4 h-4" />
            </Link>
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
            <div className="relative flex items-center" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className="relative flex items-center justify-center w-10 h-10 bg-[#ff950e] border border-white rounded-full shadow hover:scale-105 transition"
                style={{ padding: 0 }}
              >
                <Bell className="w-6 h-6 text-black" style={{ zIndex: 1 }} />
                {notifications.length > 0 && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: '-6px',
                      right: '-6px',
                      background: '#fff',
                      color: '#ff950e',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      width: '18px',
                      height: '18px',
                      textAlign: 'center',
                      border: '2px solid #ff950e',
                      fontWeight: 700,
                      zIndex: 2,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 top-12 w-80 bg-card text-white rounded-xl shadow-2xl z-50 border border-[#333]">
                  <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-3 text-sm text-center text-gray-400">No notifications</li>
                    ) : (
                      notifications.map((note, i) => (
                        <li key={i} className="flex justify-between items-start p-3 text-sm hover:bg-[#222] transition">
                          <span className="text-gray-200 leading-snug">{note}</span>
                          <button
                            onClick={() => {
                              if (sellerNotifications && sellerNotifications.indexOf(note) !== -1) {
                                const origIndex = sellerNotifications.indexOf(note);
                                clearSellerNotification(origIndex);
                              }
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

        {mounted && role === 'buyer' && !isAdminUser && (
          <>
            <Link href="/buyers/dashboard" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">Dashboard</Link>
            <Link href="/buyers/my-orders" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">My Orders</Link>
            <Link href="/wallet/buyer" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span>${Math.max(buyerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/buyers/messages" className="relative text-white hover:text-primary text-xs px-2 py-1 rounded transition flex items-center">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-2 bg-white text-[#ff950e] text-[10px] rounded-full flex items-center justify-center"
                  style={{
                    width: '18px',
                    height: '18px',
                    fontWeight: 700,
                    border: '2px solid #ff950e',
                    zIndex: 2,
                    fontSize: '11px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }}
                >
                  {unreadCount}
                </span>
              )}
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
