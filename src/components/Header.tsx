// src/components/Header.tsx
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
  DollarSign,
  Crown,
  Shield,
  Heart
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
    <header className="bg-gradient-to-r from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white shadow-2xl px-6 py-3 flex justify-between items-center z-50 relative border-b border-[#ff950e]/20 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <img src="/logo.png" alt="PantyPost Logo" className="relative w-24 h-auto drop-shadow-2xl transform group-hover:scale-105 transition duration-300" />
        </div>
      </Link>

      <nav className="flex items-center gap-x-2">
        <Link href="/browse" className="group flex items-center gap-1.5 bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 shadow-lg hover:shadow-[#ff950e]/20 text-xs">
          <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Browse</span>
        </Link>

        {isAdminUser && (
          <>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-300">ADMIN</span>
            </div>
            
            <div className="relative flex items-center">
              <Link
                href="/admin/reports"
                className="group flex items-center gap-1.5 bg-gradient-to-r from-red-900/20 to-orange-900/20 hover:from-red-900/30 hover:to-orange-900/30 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-500/50 shadow-lg text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="font-medium">Reports</span>
                {reportCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-pulse">
                    {reportCount}
                  </span>
                )}
              </Link>
            </div>
            
            <Link href="/admin/resolved" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>Resolved</span>
            </Link>
            
            <Link href="/admin/messages" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Messages</span>
            </Link>
            
            <Link href="/admin/verification-requests" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs">
              <ClipboardCheck className="w-3.5 h-3.5 text-yellow-400" />
              <span>Verify</span>
            </Link>
            
            <Link href="/admin/wallet-management" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs">
              <DollarSign className="w-3.5 h-3.5 text-green-400" />
              <span>Wallets</span>
            </Link>
            
            <Link href="/wallet/admin" className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/20 to-pink-900/20 hover:from-purple-900/30 hover:to-pink-900/30 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 text-xs">
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-purple-300" key={`admin-balance-${balanceKey}`}>${adminBalance.toFixed(2)}</span>
            </Link>
          </>
        )}

        {role === 'seller' && !isAdminUser && (
          <>
            <Link href="/sellers/my-listings" className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
              <Package className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>My Listings</span>
            </Link>
            
            <Link href="/sellers/profile" className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
              <User className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>Profile</span>
            </Link>
            
            <Link href="/sellers/verify" className="group flex items-center gap-1.5 bg-gradient-to-r from-green-900/20 to-emerald-900/20 hover:from-green-900/30 hover:to-emerald-900/30 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-green-500/30 hover:border-green-500/50 shadow-lg text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Get Verified</span>
            </Link>
            
            <Link href="/wallet/seller" className="group flex items-center gap-1.5 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#ff950e]/30 hover:border-[#ff950e]/50 shadow-lg text-xs">
              <Wallet className="w-3.5 h-3.5 text-[#ff950e]" />
              <span className="font-bold text-[#ff950e]" key={`seller-balance-${balanceKey}`}>${Math.max(sellerBalance, 0).toFixed(2)}</span>
            </Link>
            
            <Link href="/sellers/messages" className="relative group">
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
                <MessageSquare className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                <span>Messages</span>
              </div>
              {unreadCount > 0 && !isMessagesPage && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
                  {unreadCount}
                </span>
              )}
            </Link>
            
            <Link href="/sellers/subscribers" className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
              <Users className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>Subscribers</span>
            </Link>
            
            <div className="relative">
              <Link
                href="/sellers/orders-to-fulfil"
                className="group flex items-center gap-1.5 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-white px-4 py-2 rounded-lg shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transition-all duration-300 transform hover:scale-105 border border-white/20 text-xs"
              >
                <Package className="w-4 h-4 text-white" />
                <span className="font-bold text-white">Orders to Fulfil</span>
              </Link>
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#ff950e] text-[10px] rounded-full px-1.5 py-0.5 min-w-[20px] text-center border-2 border-[#ff950e] font-bold shadow-lg animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            
            <div className="relative flex items-center" ref={notifRef}>
              <button
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className="relative flex items-center justify-center w-10 h-10 bg-[#ff950e] border border-white rounded-full shadow hover:scale-105 transition hover:bg-[#ff6b00]"
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
                <div className="absolute right-0 top-12 w-80 bg-gradient-to-b from-[#1a1a1a] to-[#111] text-white rounded-2xl shadow-2xl z-50 border border-[#ff950e]/30 overflow-hidden backdrop-blur-md">
                  <div className="bg-gradient-to-r from-[#ff950e]/20 to-[#ff6b00]/20 px-4 py-2 border-b border-[#ff950e]/30">
                    <h3 className="text-sm font-bold text-[#ff950e]">Notifications</h3>
                  </div>
                  <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <li className="p-4 text-sm text-center text-gray-400">No new notifications</li>
                    ) : (
                      notifications.map((note, i) => (
                        <li key={i} className="flex justify-between items-start p-3 text-sm hover:bg-[#222]/50 transition-colors">
                          <span className="text-gray-200 leading-snug pr-2">{note}</span>
                          <button
                            onClick={() => {
                              if (sellerNotifications && sellerNotifications.indexOf(note) !== -1) {
                                const origIndex = sellerNotifications.indexOf(note);
                                clearSellerNotification(origIndex);
                              }
                            }}
                            className="text-xs text-[#ff950e] hover:text-[#ff6b00] font-bold transition-colors whitespace-nowrap"
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
            <Link href="/buyers/dashboard" className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
              <User className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>Dashboard</span>
            </Link>
            
            <Link href="/buyers/my-orders" className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
              <Package className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>My Orders</span>
            </Link>
            
            <Link href="/wallet/buyer" className="group flex items-center gap-1.5 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#ff950e]/30 hover:border-[#ff950e]/50 shadow-lg text-xs">
              <Wallet className="w-3.5 h-3.5 text-[#ff950e]" />
              <span className="font-bold text-[#ff950e]" key={`buyer-balance-${balanceKey}`}>${Math.max(buyerBalance, 0).toFixed(2)}</span>
            </Link>
            
            <Link href="/buyers/messages" className="relative group">
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
                <MessageSquare className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                <span>Messages</span>
              </div>
              {unreadCount > 0 && !isMessagesPage && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
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
              className="bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 shadow-lg hover:shadow-[#ff950e]/20"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105 border border-white/20"
            >
              Sign Up
            </Link>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-2 ml-1">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 px-3 py-1.5 rounded-lg border border-[#ff950e]/30">
              {role === 'seller' && <Heart className="w-3.5 h-3.5 text-[#ff950e]" />}
              {role === 'buyer' && <ShoppingBag className="w-3.5 h-3.5 text-[#ff950e]" />}
              {isAdminUser && <Crown className="w-3.5 h-3.5 text-purple-400" />}
              <span className="text-[#ff950e] font-bold text-xs">{username}</span>
              <span className="text-gray-400 text-[10px]">({role})</span>
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
              className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
              <span>Log out</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
