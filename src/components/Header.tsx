// src/components/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
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
  Heart,
  RotateCcw,
  Trash2,
  Ban,
  Menu,
  X
} from 'lucide-react';
import { usePathname } from 'next/navigation';

// ✅ Custom hooks for better reusability
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    intervalRef.current = setInterval(tick, delay);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [delay]);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
};

// ✅ Safe localStorage operations with error handling
const safeParseJSON = (str: string, fallback: any = {}) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Failed to parse JSON from localStorage:', error);
    return fallback;
  }
};

const safeSetLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { 
    sellerNotifications, 
    clearSellerNotification, 
    restoreSellerNotification, 
    permanentlyDeleteSellerNotification, 
    listings, 
    checkEndedAuctions 
  } = useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance, orderHistory } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { messages } = useMessages();
  
  // ✅ Simplified state management - removed redundant `mounted` state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'active' | 'cleared'>('active');
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState(0);
  
  // ✅ Button loading states to prevent double-clicks
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [deletingNotifications, setDeletingNotifications] = useState(false);
  
  // Refs for cleanup and optimization
  const notifRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const lastBalanceUpdate = useRef(0);
  const lastAuctionCheck = useRef(0);

  // Early return for excluded pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  // Derived values
  const isAdminUser = user?.username === 'oakley' || user?.username === 'gerome';
  const role = user?.role ?? null;
  const username = user?.username ?? '';

  // ✅ Click outside handlers using custom hook
  useClickOutside(notifRef, () => setShowNotifDropdown(false));
  useClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Memoized notification processing with safe error handling
  const processedNotifications = useMemo(() => {
    if (!user?.username || user.role !== 'seller' || !sellerNotifications) {
      return { active: [], cleared: [] };
    }

    const addNotificationEmojis = (message: string): string => {
      if (message.includes('New sale:') && !message.includes('Auction ended:')) {
        return `💰🛍️ ${message}`;
      }
      if (message.includes('Auction ended:') && message.includes('sold to')) {
        return `💰🏆 ${message}`;
      }
      if (!message.match(/^[🎉💸💰🛒🔨⚠️ℹ️🛑🏆💰🛍️]/)) {
        if (message.includes('subscribed to you')) return `🎉 ${message}`;
        if (message.includes('Tip received')) return `💸 ${message}`;
        if (message.includes('New custom order')) return `🛒 ${message}`;
        if (message.includes('New bid')) return `💰 ${message}`;
        if (message.includes('created a new auction')) return `🔨 ${message}`;
        if (message.includes('cancelled your auction')) return `🛑 ${message}`;
        if (message.includes('Reserve price not met')) return `🔨 ${message}`;
        if (message.includes('No bids were placed')) return `🔨 ${message}`;
        if (message.includes('insufficient funds')) return `⚠️ ${message}`;
        if (message.includes('payment error')) return `⚠️ ${message}`;
        if (message.includes('Original highest bidder')) return `ℹ️ ${message}`;
      }
      return message;
    };

    const deduplicateNotifications = (notifications: any[]): any[] => {
      const seen = new Map<string, any>();
      const deduped: any[] = [];
      
      for (const notification of notifications) {
        const cleanMessage = notification.message.replace(/^[🎉💸💰🛒🔨⚠️ℹ️🛑🏆🛍️]\s*/, '').trim();
        const timestamp = new Date(notification.timestamp);
        const timeWindow = Math.floor(timestamp.getTime() / (60 * 1000));
        const key = `${cleanMessage}_${timeWindow}`;
        
        if (!seen.has(key)) {
          seen.set(key, notification);
          deduped.push({
            ...notification,
            message: addNotificationEmojis(notification.message)
          });
        } else {
          const existing = seen.get(key);
          if (timestamp > new Date(existing.timestamp)) {
            seen.set(key, notification);
            const existingIndex = deduped.findIndex((n: any) => n.id === existing.id);
            if (existingIndex !== -1) {
              deduped[existingIndex] = {
                ...notification,
                message: addNotificationEmojis(notification.message)
              };
            }
          }
        }
      }
      
      return deduped.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    try {
      const active = deduplicateNotifications(sellerNotifications.filter(n => !n.cleared));
      const cleared = deduplicateNotifications(sellerNotifications.filter(n => n.cleared));
      return { active, cleared };
    } catch (error) {
      console.error('Error processing notifications:', error);
      return { active: [], cleared: [] };
    }
  }, [user?.username, user?.role, sellerNotifications]);

  // Memoized balances with safe function checking
  const buyerBalance = useMemo(() => {
    if (!username || typeof getBuyerBalance !== 'function') return 0;
    try {
      return getBuyerBalance(username) || 0;
    } catch (error) {
      console.error('Error getting buyer balance:', error);
      return 0;
    }
  }, [getBuyerBalance, username, balanceUpdateTrigger]);

  const sellerBalance = useMemo(() => {
    if (!username || typeof getSellerBalance !== 'function') return 0;
    try {
      return getSellerBalance(username) || 0;
    } catch (error) {
      console.error('Error getting seller balance:', error);
      return 0;
    }
  }, [getSellerBalance, username, balanceUpdateTrigger]);

  // Memoized unread message count with error handling
  const unreadCount = useMemo(() => {
    if (!user?.username) return 0;
    
    try {
      const threads: { [otherUser: string]: any[] } = {};
      
      Object.values(messages)
        .flat()
        .forEach((msg: any) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            if (!threads[otherParty]) threads[otherParty] = [];
            threads[otherParty].push(msg);
          }
        });

      let totalUnreadCount = 0;
      Object.entries(threads).forEach(([otherUser, msgs]) => {
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === otherUser && msg.receiver === user.username
        ).length;
        totalUnreadCount += threadUnreadCount;
      });
      
      return totalUnreadCount;
    } catch (error) {
      console.error('Error calculating unread count:', error);
      return 0;
    }
  }, [user?.username, messages]);

  // ✅ Rate-limited balance update function with context safety
  const forceUpdateBalances = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastBalanceUpdate.current < 2000) return; // Rate limit to 2 seconds
    
    lastBalanceUpdate.current = now;
    setBalanceUpdateTrigger(prev => prev + 1);
  }, []);

  // Rate-limited auction check function
  const checkAuctionsWithRateLimit = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastAuctionCheck.current < 10000) return; // Rate limit to 10 seconds
    
    lastAuctionCheck.current = now;
    
    try {
      if (typeof checkEndedAuctions === 'function') {
        checkEndedAuctions();
        // Update balances after auction check with delay
        setTimeout(() => {
          if (isMountedRef.current) {
            forceUpdateBalances();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error checking ended auctions:', err);
    }
  }, [checkEndedAuctions, forceUpdateBalances]);

  // Update report count with error handling
  const updateReportCount = useCallback(() => {
    if (!isAdminUser || !isMountedRef.current) return;
    
    try {
      const count = getReportCount();
      const validCount = typeof count === 'number' && !isNaN(count) && count >= 0 ? count : 0;
      setReportCount(validCount);
    } catch (err) {
      console.error('Error updating report count:', err);
      setReportCount(0);
    }
  }, [isAdminUser]);

  // ✅ Improved bulk notification actions with loading states and error handling
  const clearAllNotifications = useCallback(async () => {
    if (!user || user.role !== 'seller' || !sellerNotifications || clearingNotifications) return;
    
    setClearingNotifications(true);
    
    try {
      const username = user.username;
      const activeNotifsToUpdate = sellerNotifications.filter(notification => !notification.cleared);
      
      if (activeNotifsToUpdate.length === 0) return;
      
      const updatedNotifications = sellerNotifications.map(notification => ({
        ...notification,
        cleared: notification.cleared ? notification.cleared : true
      }));
      
      const notificationStore = safeParseJSON(localStorage.getItem('seller_notifications_store') || '{}', {});
      notificationStore[username] = updatedNotifications;
      
      if (safeSetLocalStorage('seller_notifications_store', notificationStore)) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'seller_notifications_store',
          newValue: JSON.stringify(notificationStore)
        }));
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setClearingNotifications(false);
    }
  }, [user, sellerNotifications, clearingNotifications]);

  const deleteAllClearedNotifications = useCallback(async () => {
    if (!user || user.role !== 'seller' || !sellerNotifications || deletingNotifications) return;
    
    setDeletingNotifications(true);
    
    try {
      const username = user.username;
      const clearedNotifsToDelete = sellerNotifications.filter(notification => notification.cleared);
      
      if (clearedNotifsToDelete.length === 0) return;
      
      const updatedNotifications = sellerNotifications.filter(notification => !notification.cleared);
      
      const notificationStore = safeParseJSON(localStorage.getItem('seller_notifications_store') || '{}', {});
      notificationStore[username] = updatedNotifications;
      
      if (safeSetLocalStorage('seller_notifications_store', notificationStore)) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'seller_notifications_store',
          newValue: JSON.stringify(notificationStore)
        }));
      }
    } catch (error) {
      console.error('Error deleting cleared notifications:', error);
    } finally {
      setDeletingNotifications(false);
    }
  }, [user, sellerNotifications, deletingNotifications]);

  // Setup intervals using custom hook
  const clearBalanceInterval = useInterval(() => {
    if (isMountedRef.current) forceUpdateBalances();
  }, 15000);

  const clearAuctionInterval = useInterval(() => {
    if (isMountedRef.current) checkAuctionsWithRateLimit();
  }, 30000);

  // Calculate pending orders count with error handling
  useEffect(() => {
    if (!isMountedRef.current || !user || user.role !== 'seller') return;
    
    try {
      const sales = orderHistory.filter((order) => order.seller === user.username);
      const requests = getRequestsForUser(user.username, 'seller');
      const acceptedCustoms = requests.filter((req) => req.status === 'accepted');
      setPendingOrdersCount(sales.length + acceptedCustoms.length);
    } catch (err) {
      console.error('Error calculating pending orders:', err);
      setPendingOrdersCount(0);
    }
  }, [user, orderHistory, getRequestsForUser]);

  // ✅ Main component setup with secure context function instead of global window function
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isMountedRef.current = true;
    
    // Initial updates
    updateReportCount();
    forceUpdateBalances();
    checkAuctionsWithRateLimit();
    
    // Event listeners
    const handleUpdateReports = () => {
      if (isMountedRef.current) updateReportCount();
    };
    
    const handleAuctionEnd = () => {
      if (isMountedRef.current) forceUpdateBalances();
    };
    
    window.addEventListener('updateReports', handleUpdateReports);
    window.addEventListener('auctionEnded', handleAuctionEnd);
    
    // ✅ Secure context-based balance updates instead of global window function
    const balanceUpdateContext = { forceUpdate: forceUpdateBalances };
    (window as any).__pantypost_balance_context = balanceUpdateContext;
    
    return () => {
      isMountedRef.current = false;
      
      // Clear intervals
      clearBalanceInterval();
      clearAuctionInterval();
      
      // Remove event listeners
      window.removeEventListener('updateReports', handleUpdateReports);
      window.removeEventListener('auctionEnd', handleAuctionEnd);
      
      // Clean up context
      if (typeof window !== 'undefined') {
        delete (window as any).__pantypost_balance_context;
      }
    };
  }, [updateReportCount, forceUpdateBalances, checkAuctionsWithRateLimit, clearBalanceInterval, clearAuctionInterval]);

  // Reset notification tab when dropdown opens
  useEffect(() => {
    if (showNotifDropdown) {
      setActiveNotifTab('active');
    }
  }, [showNotifDropdown]);

  // ✅ Reusable mobile link renderer to reduce code duplication
  const renderMobileLink = (href: string, icon: React.ReactNode, label: string, badge?: number) => (
    <Link 
      href={href}
      className="flex items-center gap-3 text-[#ff950e] hover:bg-[#ff950e]/10 p-3 rounded-lg transition-colors"
      onClick={() => setMobileMenuOpen(false)}
      style={{ touchAction: 'manipulation' }} // ✅ Better mobile responsiveness
    >
      {icon}
      <span>{label}</span>
      {badge && badge > 0 && (
        <span className="bg-[#ff950e] text-white text-xs rounded-full px-2 py-0.5 ml-auto">
          {badge}
        </span>
      )}
    </Link>
  );

  // Early return if not mounted
  if (!isMountedRef.current) return null;

  // ✅ Mobile Navigation Component with better scroll handling
  const MobileMenu = () => (
    <div className={`mobile-menu fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      <div 
        ref={mobileMenuRef}
        className="fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-[#1a1a1a] to-[#111] border-r border-[#ff950e]/30 overflow-y-auto overscroll-contain"
        style={{ touchAction: 'pan-y' }} // ✅ Prevent iOS bounce scroll
      >
        <div className="p-4 border-b border-[#ff950e]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="PantyPost" className="w-8 h-auto" />
              <span className="text-[#ff950e] font-bold">PantyPost</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#ff950e] hover:text-white"
              aria-label="Close menu"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {renderMobileLink('/browse', <ShoppingBag className="w-5 h-5" />, 'Browse')}
          
          {isAdminUser && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/20 rounded-lg">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-bold">ADMIN</span>
              </div>
              {renderMobileLink('/admin/reports', <Shield className="w-5 h-5" />, 'Reports', reportCount)}
            </>
          )}
          
          {role === 'seller' && !isAdminUser && (
            <>
              {renderMobileLink('/sellers/my-listings', <Package className="w-5 h-5" />, 'My Listings')}
              {renderMobileLink('/sellers/profile', <User className="w-5 h-5" />, 'Profile')}
              {renderMobileLink('/sellers/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
              {renderMobileLink('/wallet/seller', <Wallet className="w-5 h-5" />, `Wallet: $${Math.max(sellerBalance, 0).toFixed(2)}`)}
            </>
          )}
          
          {role === 'buyer' && !isAdminUser && (
            <>
              {renderMobileLink('/buyers/dashboard', <User className="w-5 h-5" />, 'Dashboard')}
              {renderMobileLink('/buyers/my-orders', <Package className="w-5 h-5" />, 'My Orders')}
              {renderMobileLink('/buyers/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
              {renderMobileLink('/wallet/buyer', <Wallet className="w-5 h-5" />, `Wallet: $${Math.max(buyerBalance, 0).toFixed(2)}`)}
            </>
          )}
          
          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="flex items-center gap-3 text-[#ff950e] hover:bg-[#ff950e]/10 p-3 rounded-lg transition-colors w-full text-left"
              style={{ touchAction: 'manipulation' }}
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-gradient-to-r from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white shadow-2xl px-4 lg:px-6 py-3 flex justify-between items-center z-40 relative border-b border-[#ff950e]/20 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <img 
              src="/logo.png" 
              alt="PantyPost Logo" 
              className="relative w-16 lg:w-24 h-auto drop-shadow-2xl transform group-hover:scale-105 transition duration-300" 
            />
          </div>
        </Link>

        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff6b00] transition-colors"
            aria-label="Open menu"
            style={{ touchAction: 'manipulation' }}
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Desktop Navigation */}
        <nav className={`${isMobile ? 'hidden' : 'flex'} items-center gap-x-2`}>
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
              
              <Link href="/admin/bans" className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/20 to-red-900/20 hover:from-purple-900/30 hover:to-red-900/30 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 text-xs">
                <Ban className="w-3.5 h-3.5 text-purple-400" />
                <span>Bans</span>
              </Link>
              
              <Link href="/admin/resolved" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span>Resolved</span>
              </Link>
              
              <Link href="/admin/messages" className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs relative">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
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
                <span className="font-bold text-purple-300">${adminBalance.toFixed(2)}</span>
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
                <span className="font-bold text-[#ff950e]">${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </Link>
              
              <Link href="/sellers/messages" className="relative group">
                <div className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                  <span>Messages</span>
                </div>
                {unreadCount > 0 && (
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
                  aria-label="Notifications"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Bell className="w-6 h-6 text-black" />
                  {processedNotifications.active.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-[#ff950e] text-[11px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-[#ff950e] font-bold shadow-lg">
                      {processedNotifications.active.length}
                    </span>
                  )}
                </button>
                
                {showNotifDropdown && (
                  <div className="absolute right-0 top-12 w-80 bg-gradient-to-b from-[#1a1a1a] to-[#111] text-white rounded-2xl shadow-2xl z-50 border border-[#ff950e]/30 overflow-hidden backdrop-blur-md">
                    <div className="bg-gradient-to-r from-[#ff950e]/20 to-[#ff6b00]/20 px-4 py-2 border-b border-[#ff950e]/30">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-[#ff950e]">Notifications</h3>
                        {activeNotifTab === 'active' && processedNotifications.active.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            disabled={clearingNotifications}
                            className="text-xs text-white hover:text-[#ff950e] font-medium transition-colors px-2 py-1 rounded bg-black/20 hover:bg-[#ff950e]/10 border border-white/20 hover:border-[#ff950e]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ touchAction: 'manipulation' }}
                          >
                            {clearingNotifications ? 'Clearing...' : 'Clear All'}
                          </button>
                        )}
                        {activeNotifTab === 'cleared' && processedNotifications.cleared.length > 0 && (
                          <button
                            onClick={deleteAllClearedNotifications}
                            disabled={deletingNotifications}
                            className="text-xs text-white hover:text-red-400 font-medium transition-colors px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ touchAction: 'manipulation' }}
                          >
                            {deletingNotifications ? 'Deleting...' : 'Delete All'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex border-b border-gray-800">
                      <button
                        onClick={() => setActiveNotifTab('active')}
                        className={`flex-1 px-4 py-2 text-xs font-medium transition-colors relative ${
                          activeNotifTab === 'active' 
                            ? 'text-[#ff950e] bg-[#ff950e]/10' 
                            : 'text-gray-400 hover:text-gray-300 hover:bg-[#222]/50'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Active ({processedNotifications.active.length})
                        {activeNotifTab === 'active' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveNotifTab('cleared')}
                        className={`flex-1 px-4 py-2 text-xs font-medium transition-colors relative ${
                          activeNotifTab === 'cleared' 
                            ? 'text-[#ff950e] bg-[#ff950e]/10' 
                            : 'text-gray-400 hover:text-gray-300 hover:bg-[#222]/50'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Cleared ({processedNotifications.cleared.length})
                        {activeNotifTab === 'cleared' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]"></div>
                        )}
                      </button>
                    </div>

                    <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto overscroll-contain">
                      {activeNotifTab === 'active' ? (
                        processedNotifications.active.length === 0 ? (
                          <li className="p-4 text-sm text-center text-gray-400">No active notifications</li>
                        ) : (
                          processedNotifications.active.map((notification, i) => (
                            <li key={notification.id || i} className="flex justify-between items-start p-3 text-sm hover:bg-[#222]/50 transition-colors">
                              <div className="flex-1 pr-2">
                                <span className="text-gray-200 leading-snug">{notification.message}</span>
                                {notification.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => clearSellerNotification(notification.id)}
                                className="text-xs text-[#ff950e] hover:text-[#ff6b00] font-bold transition-colors whitespace-nowrap"
                                style={{ touchAction: 'manipulation' }}
                              >
                                Clear
                              </button>
                            </li>
                          ))
                        )
                      ) : (
                        processedNotifications.cleared.length === 0 ? (
                          <li className="p-4 text-sm text-center text-gray-400">No cleared notifications</li>
                        ) : (
                          processedNotifications.cleared.map((notification, i) => (
                            <li key={notification.id || `cleared-${i}`} className="flex justify-between items-start p-3 text-sm hover:bg-[#222]/50 transition-colors">
                              <div className="flex-1 pr-2">
                                <span className="text-gray-400 leading-snug">{notification.message}</span>
                                {notification.timestamp && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 flex-col">
                                <button
                                  onClick={() => restoreSellerNotification(notification.id)}
                                  className="text-xs text-green-400 hover:text-green-300 font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                                  title="Restore notification"
                                  style={{ touchAction: 'manipulation' }}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Restore
                                </button>
                                <button
                                  onClick={() => permanentlyDeleteSellerNotification(notification.id)}
                                  className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                                  title="Delete permanently"
                                  style={{ touchAction: 'manipulation' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))
                        )
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
                <span className="font-bold text-[#ff950e]">${Math.max(buyerBalance, 0).toFixed(2)}</span>
              </Link>
              
              <Link href="/buyers/messages" className="relative group">
                <div className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                  <span>Messages</span>
                </div>
                {unreadCount > 0 && (
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
                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105 border border-white/20"
                style={{ color: '#000' }}
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
              <button
                onClick={logout}
                className="group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </nav>
      </header>
      
      <MobileMenu />
    </>
  );
}
