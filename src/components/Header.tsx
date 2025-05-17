'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages, getReportCount } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  DollarSign
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, logout, sellerNotifications, clearSellerNotification, listings, checkEndedAuctions } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance, orderHistory, wallet } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { messages } = useMessages();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [balanceKey, setBalanceKey] = useState(0); // Force rerender key
  
  // Store readThreads in a ref to avoid state updates causing re-renders
  const readThreadsRef = useRef<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  
  // For balance polling - ref to avoid re-creating the interval
  const balancePollingRef = useRef<NodeJS.Timeout | null>(null);
  // Store last update time to prevent too frequent updates
  const lastBalanceUpdateRef = useRef<number>(0);
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(false);

  const isAdminUser = user?.username === 'oakley' || user?.username === 'gerome';
  const role = user?.role ?? null;
  const username = user?.username ?? '';
  const isMessagesPage = pathname?.includes('/messages');

  const notifications = user?.role === 'seller' ? sellerNotifications || [] : [];

  // Load read threads from localStorage on mount - but only once
  useEffect(() => {
    if (!mounted || !user || typeof window === 'undefined') return;
    
    try {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const storedReadThreads = localStorage.getItem(readThreadsKey);
      
      if (storedReadThreads) {
        const parsedThreads = JSON.parse(storedReadThreads);
        if (Array.isArray(parsedThreads)) {
          readThreadsRef.current = new Set(parsedThreads);
        }
      }
    } catch (e) {
      console.error('Failed to parse read threads', e);
    }
  }, [mounted, user]);

  // Modified unread message counting logic to match the messages page
  // Using a callback to avoid recreating this function on every render
  const calculateUnreadCount = useCallback(() => {
    if (!user?.username) return 0;
    
    // Count the number of threads with unread messages
    // Each account with unread messages counts as 1, regardless of how many messages
    const threadCounts: { [buyer: string]: number } = {};
    
    Object.values(messages)
      .flat()
      .forEach(msg => {
        // Only count messages FROM others TO the user as unread
        const isForUser = msg.receiver === user.username;
        const isFromOther = msg.sender !== user.username;
        const isUnread = !msg.read;
        
        // Don't count as unread if the thread is in readThreadsRef
        if (isForUser && isFromOther && isUnread && !readThreadsRef.current.has(msg.sender)) {
          // Just add to or increment the thread count
          threadCounts[msg.sender] = (threadCounts[msg.sender] || 0) + 1;
        }
      });
    
    // Return the number of unique threads with unread messages
    return Object.keys(threadCounts).length;
  }, [user, messages]);

  // Use the callback in a memoized value that only updates when dependencies change
  const unreadCount = useMemo(() => calculateUnreadCount(), [calculateUnreadCount]);

  // Function to force update balances - with rate limiting to prevent infinite loops
  const forceUpdateBalances = useCallback(() => {
    const now = Date.now();
    // Only update if at least 500ms have passed since last update
    if (now - lastBalanceUpdateRef.current >= 500 && isMountedRef.current) {
      lastBalanceUpdateRef.current = now;
      setBalanceKey(prev => prev + 1);
    }
  }, []);

  // Enhanced auction check function that updates balances immediately after checking
  const checkAuctionsAndUpdateBalances = useCallback(() => {
    // Default to false
    let auctionsEnded = false;
    
    if (typeof checkEndedAuctions === 'function') {
      try {
        // Since TypeScript thinks checkEndedAuctions returns void,
        // we need to call it without assuming a return value
        checkEndedAuctions();
        
        // For now, we'll just force a balance update when auctions are checked
        // This is a workaround since we can't reliably determine if auctions ended
        forceUpdateBalances();
        
        // Since we can't actually determine if auctions ended from the return value,
        // we'll just assume they did for now (this could be refined later)
        auctionsEnded = true;
      } catch (err) {
        console.error('Error checking ended auctions:', err);
      }
    }
    return auctionsEnded;
  }, [checkEndedAuctions, forceUpdateBalances]);

  // Set up auction checking with immediate balance updates
  useEffect(() => {
    if (!mounted) return;
    
    // Initial check on mount
    if (isMountedRef.current && typeof checkEndedAuctions === 'function') {
      try {
        checkAuctionsAndUpdateBalances();
      } catch (err) {
        console.error('Error during initial auction check:', err);
      }
    }
    
    // Set up polling that's less frequent to avoid rapid successive updates
    const auctionCheckInterval = setInterval(() => {
      if (isMountedRef.current && typeof checkEndedAuctions === 'function') {
        try {
          checkAuctionsAndUpdateBalances();
        } catch (err) {
          console.error('Error during auction check interval:', err);
        }
      }
    }, 10000); // Check every 10 seconds instead of 3 seconds
    
    return () => clearInterval(auctionCheckInterval);
  }, [mounted, checkAuctionsAndUpdateBalances, checkEndedAuctions]);

  // Set up balance polling with rate limiting
  useEffect(() => {
    if (!mounted || !username) return;
    
    // Clear any existing polling
    if (balancePollingRef.current) {
      clearInterval(balancePollingRef.current);
      balancePollingRef.current = null;
    }
    
    // Start polling balances less frequently
    balancePollingRef.current = setInterval(() => {
      if (isMountedRef.current) {
        forceUpdateBalances();
      }
    }, 5000); // Poll every 5 seconds instead of every second
    
    return () => {
      if (balancePollingRef.current) {
        clearInterval(balancePollingRef.current);
        balancePollingRef.current = null;
      }
    };
  }, [mounted, username, forceUpdateBalances]);

  // Calculate pending orders count
  useEffect(() => {
    if (!mounted || !user || user.role !== 'seller') return;
    
    try {
      const sales = orderHistory.filter((order) => order.seller === user.username);
      const requests = getRequestsForUser(user.username, 'seller');
      const acceptedCustoms = requests.filter((req) => req.status === 'accepted');
      setPendingOrdersCount(sales.length + acceptedCustoms.length);
    } catch (err) {
      console.error('Error calculating pending orders:', err);
    }
  }, [mounted, user, orderHistory, getRequestsForUser]);

  // Memoized balances to avoid recalculating on every render
  const buyerBalance = useMemo(() => {
    return typeof getBuyerBalance === 'function' && typeof username === 'string' 
      ? getBuyerBalance(username) || 0 
      : 0;
  }, [getBuyerBalance, username, balanceKey]);

  const sellerBalance = useMemo(() => {
    return typeof getSellerBalance === 'function' && typeof username === 'string'
      ? getSellerBalance(username) || 0
      : 0;
  }, [getSellerBalance, username, balanceKey]);

  // Extract report count updating to a stable callback
  const updateReportCount = useCallback(() => {
    if (typeof window !== 'undefined' && isAdminUser && isMountedRef.current) {
      try {
        const count = typeof getReportCount === 'function' ? getReportCount() : 0;
        setReportCount(count);
      } catch (err) {
        console.error('Error updating report count:', err);
      }
    }
  }, [isAdminUser]);

  // Listen for both storage events and custom events for read threads updates
  useEffect(() => {
    if (!mounted || !user) return;
    
    // Handle when localStorage changes in another tab/window
    const handleStorageChange = (event: StorageEvent) => {
      if (!isMountedRef.current || !user) return;
      
      if (event.key?.startsWith('panty_read_threads_')) {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        if (event.key === readThreadsKey && event.newValue) {
          try {
            const newValue = JSON.parse(event.newValue);
            if (Array.isArray(newValue)) {
              readThreadsRef.current = new Set(newValue);
            }
          } catch (e) {
            console.error('Failed to parse updated read threads', e);
          }
        }
      }
    };

    // Handle read threads updated event without causing a re-render
    const handleReadThreadsUpdated = (event: CustomEvent) => {
      if (!isMountedRef.current || !user) return;
      
      if (event.detail?.username === user.username) {
        if (Array.isArray(event.detail.threads)) {
          readThreadsRef.current = new Set(event.detail.threads);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('readThreadsUpdated', handleReadThreadsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('readThreadsUpdated', handleReadThreadsUpdated as EventListener);
    };
  }, [mounted, user]);

  // Initial load and event setup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isMountedRef.current = true;
    setMounted(true);
    
    // Only call updateReportCount if it's a valid function
    if (typeof updateReportCount === 'function') {
      try {
        updateReportCount();
      } catch (err) {
        console.error('Error updating report count:', err);
      }
    }
    
    window.addEventListener('updateReports', updateReportCount);

    // Handle clicking outside notification dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Custom auction end event listener - with rate limiting
    const handleAuctionEnd = () => {
      const now = Date.now();
      if (now - lastBalanceUpdateRef.current >= 500) {
        lastBalanceUpdateRef.current = now;
        forceUpdateBalances();
      }
    };
    
    window.addEventListener('auctionEnded', handleAuctionEnd);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('updateReports', updateReportCount);
      window.removeEventListener('auctionEnded', handleAuctionEnd);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updateReportCount, forceUpdateBalances]);

  // Add this to window with rate limiting
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    // Create a rate limited version for the global function
    const rateLimitedBalanceUpdate = () => {
      const now = Date.now();
      if (now - lastBalanceUpdateRef.current >= 500 && isMountedRef.current) {
        lastBalanceUpdateRef.current = now;
        setBalanceKey(prev => prev + 1);
      }
    };
    
    (window as any).forceUpdateBalances = rateLimitedBalanceUpdate;
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).forceUpdateBalances;
      }
    };
  }, [mounted]);

  // If not yet mounted, show placeholder or nothing
  if (!mounted) return null;

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

        {isAdminUser && (
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
            <Link 
              href="/admin/wallet-management" 
              className="flex items-center text-white hover:text-primary text-xs px-2 py-1 rounded transition"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Wallet Management
            </Link>
            <Link href="/wallet/admin" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              Admin Wallet
            </Link>
            <span className="text-primary font-bold text-xs" key={`admin-balance-${balanceKey}`}>${adminBalance.toFixed(2)}</span>
          </>
        )}

        {role === 'seller' && !isAdminUser && (
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
                <span key={`seller-balance-${balanceKey}`}>${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/sellers/messages" className="relative text-white hover:text-primary text-xs px-2 py-1 rounded transition flex items-center">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && !isMessagesPage && (
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

        {role === 'buyer' && !isAdminUser && (
          <>
            <Link href="/buyers/dashboard" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">Dashboard</Link>
            <Link href="/buyers/my-orders" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">My Orders</Link>
            <Link href="/wallet/buyer" className="text-white hover:text-primary text-xs px-2 py-1 rounded transition">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4" />
                <span key={`buyer-balance-${balanceKey}`}>${Math.max(buyerBalance, 0).toFixed(2)}</span>
              </span>
            </Link>
            <Link href="/buyers/messages" className="relative text-white hover:text-primary text-xs px-2 py-1 rounded transition flex items-center">
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && !isMessagesPage && (
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
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full transition hover:bg-primary-dark"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full transition hover:bg-primary-dark"
            >
              Sign Up
            </Link>
          </div>
        )}

        {user && (
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
