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
  Wallet as WalletIcon,
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
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { storageService } from '@/services';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { isAdmin } from '@/utils/security/permissions';
import { useNotifications } from '@/context/NotificationContext';

type UINotification = {
  id: string;
  message: string;
  timestamp?: string | Date;
  cleared: boolean;
  source: 'legacy' | 'ctx';
};

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
    const tick = () => savedCallback.current && savedCallback.current();
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

export default function Header(): React.ReactElement | null {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sellerNotifications, clearSellerNotification, restoreSellerNotification, permanentlyDeleteSellerNotification, listings, checkEndedAuctions } =
    useListings();
  const { getBuyerBalance, getSellerBalance, adminBalance, orderHistory, refreshAdminData } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { messages } = useMessages();

  const {
    activeNotifications: ctxActive,
    clearedNotifications: ctxCleared,
    clearNotification: ctxClearNotification,
    restoreNotification: ctxRestoreNotification,
    deleteNotification: ctxDeleteNotification,
    clearAllNotifications: ctxClearAll,
    deleteAllCleared: ctxDeleteAllCleared,
  } = useNotifications();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'active' | 'cleared'>('active');
  const [balanceUpdateTrigger, setBalanceUpdateTrigger] = useState(0);

  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [deletingNotifications, setDeletingNotifications] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const lastBalanceUpdate = useRef(0);
  const lastAuctionCheck = useRef(0);
  const hasRefreshedAdminData = useRef(false);

  const isAdminUser = isAdmin(user);
  const role = user?.role ?? null;
  const username = user?.username ? sanitizeStrict(user.username) : '';

  useClickOutside(notifRef, () => setShowNotifDropdown(false));
  useClickOutside(mobileMenuRef, () => {
    setMobileMenuOpen(false);
    setShowMobileNotifications(false);
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate pending orders count for sellers
  const pendingOrdersCount = useMemo(() => {
    if (!user?.username || user.role !== 'seller') return 0;
    
    try {
      // Filter orders for this seller that are not yet shipped
      const sellerOrders = orderHistory.filter(order => 
        order.seller === user.username && 
        (!order.shippingStatus || order.shippingStatus === 'pending' || order.shippingStatus === 'processing')
      );
      
      return sellerOrders.length;
    } catch (error) {
      console.error('Error calculating pending orders:', error);
      return 0;
    }
  }, [user?.username, user?.role, orderHistory]);

  const processedNotifications = useMemo(() => {
    if (!user?.username || user.role !== 'seller') {
      return { active: [] as UINotification[], cleared: [] as UINotification[] };
    }

    const addNotificationEmojis = (message: string): string => {
      const sanitizedMessage = sanitizeStrict(message);
      
      // Check if the message already starts with emoji characters
      // If it does, return it as-is (backend already added emojis)
      if (sanitizedMessage.match(/^[🎉💸💰🛒🔨⚠️ℹ️🛑🏆🛍️]/)) {
        return sanitizedMessage;
      }
      
      // Only add emojis if they're not already present
      if (sanitizedMessage.includes('subscribed to you')) return `🎉 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Tip received') || sanitizedMessage.includes('tipped you')) return `💸 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('New custom order')) return `🛒 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('New bid')) return `💰 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('created a new auction')) return `🔨 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('cancelled your auction')) return `🛑 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Reserve price not met')) return `🔨 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('No bids were placed')) return `🔨 ${sanitizedMessage}`;
      if (sanitizedMessage.includes('insufficient funds') || sanitizedMessage.includes('payment error')) return `⚠️ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Original highest bidder')) return `ℹ️ ${sanitizedMessage}`;
      
      return sanitizedMessage;
    };

    const deduplicateNotifications = (notifications: UINotification[]): UINotification[] => {
      const seen = new Map<string, UINotification>();
      const deduped: UINotification[] = [];

      for (const n of notifications) {
        const cleanMessage = (n.message || '').replace(/^[🎉💸💰🛒🔨⚠️ℹ️🛑🏆🛍️]\s*/, '').trim();
        const timestamp = new Date(n.timestamp || Date.now());
        const timeWindow = Math.floor(timestamp.getTime() / (60 * 1000)); // 1 minute window
        const key = `${cleanMessage}_${timeWindow}`;

        if (!seen.has(key)) {
          const withEmoji = { ...n, message: addNotificationEmojis(n.message) };
          seen.set(key, withEmoji);
          deduped.push(withEmoji);
        } else {
          const existing = seen.get(key)!;
          if (timestamp > new Date(existing.timestamp || 0)) {
            const withEmoji = { ...n, message: addNotificationEmojis(n.message) };
            seen.set(key, withEmoji);
            const idx = deduped.findIndex((x) => x.id === existing.id);
            if (idx !== -1) deduped[idx] = withEmoji;
          }
        }
      }

      return deduped.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    };

    const legacyActive: UINotification[] = (sellerNotifications || [])
      .filter((n: any) => !n.cleared)
      .map((n: any) => ({ id: n.id, message: n.message, timestamp: n.timestamp, cleared: false, source: 'legacy' as const }));

    const legacyCleared: UINotification[] = (sellerNotifications || [])
      .filter((n: any) => n.cleared)
      .map((n: any) => ({ id: n.id, message: n.message, timestamp: n.timestamp, cleared: true, source: 'legacy' as const }));

    const ctxActiveUi: UINotification[] = (ctxActive || []).map((n) => ({
      id: (n._id || n.id) as string,
      message: n.message,
      timestamp: n.createdAt,
      cleared: false,
      source: 'ctx',
    }));

    const ctxClearedUi: UINotification[] = (ctxCleared || []).map((n) => ({
      id: (n._id || n.id) as string,
      message: n.message,
      timestamp: n.createdAt,
      cleared: true,
      source: 'ctx',
    }));

    return {
      active: deduplicateNotifications([...legacyActive, ...ctxActiveUi]),
      cleared: deduplicateNotifications([...legacyCleared, ...ctxClearedUi]),
    };
  }, [user?.username, user?.role, sellerNotifications, ctxActive, ctxCleared]);

  const buyerBalance = useMemo(() => {
    if (!username || typeof getBuyerBalance !== 'function') return 0;
    try {
      const balance = getBuyerBalance(username) || 0;
      return balance;
    } catch (error) {
      console.error('Error getting buyer balance:', error);
      return 0;
    }
  }, [getBuyerBalance, username, balanceUpdateTrigger]);

  const sellerBalance = useMemo(() => {
    if (!username || typeof getSellerBalance !== 'function') return 0;
    try {
      const balance = getSellerBalance(username) || 0;
      return balance;
    } catch (error) {
      console.error('Error getting seller balance:', error);
      return 0;
    }
  }, [getSellerBalance, username, balanceUpdateTrigger]);

  const platformBalance = useMemo(() => {
    if (isAdminUser && user) return adminBalance || 0;
    return 0;
  }, [isAdminUser, user, adminBalance, balanceUpdateTrigger]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAdminBalanceUpdate = () => {
      if (isAdminUser && user) setBalanceUpdateTrigger((prev) => prev + 1);
    };
    const handlePlatformBalanceUpdate = () => {
      if (isAdminUser && user) setBalanceUpdateTrigger((prev) => prev + 1);
    };
    const handleBuyerBalanceUpdate = () => {
      if (user?.role === 'buyer') setBalanceUpdateTrigger((prev) => prev + 1);
    };
    const handleSellerBalanceUpdate = () => {
      if (user?.role === 'seller') setBalanceUpdateTrigger((prev) => prev + 1);
    };

    window.addEventListener('wallet:admin-balance-updated', handleAdminBalanceUpdate as EventListener);
    window.addEventListener('wallet:platform-balance-updated', handlePlatformBalanceUpdate as EventListener);
    window.addEventListener('platform:balance_update', handlePlatformBalanceUpdate as EventListener);
    window.addEventListener('wallet:buyer-balance-updated', handleBuyerBalanceUpdate as EventListener);
    window.addEventListener('wallet:seller-balance-updated', handleSellerBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('wallet:admin-balance-updated', handleAdminBalanceUpdate as EventListener);
      window.removeEventListener('wallet:platform-balance-updated', handlePlatformBalanceUpdate as EventListener);
      window.removeEventListener('platform:balance_update', handlePlatformBalanceUpdate as EventListener);
      window.removeEventListener('wallet:buyer-balance-updated', handleBuyerBalanceUpdate as EventListener);
      window.removeEventListener('wallet:seller-balance-updated', handleSellerBalanceUpdate as EventListener);
    };
  }, [isAdminUser, user]);

  useEffect(() => {
    if (isAdminUser && user && refreshAdminData && !hasRefreshedAdminData.current) {
      hasRefreshedAdminData.current = true;
      let cancelled = false;
      const refreshOnce = async () => {
        if (cancelled) return;
        try {
          await refreshAdminData();
          setBalanceUpdateTrigger((prev) => prev + 1);
        } catch (error) {
          console.error('[Header] Error refreshing admin data:', error);
        }
      };
      void refreshOnce();
      return () => {
        cancelled = true;
      };
    }
    if (!user || !isAdminUser) {
      hasRefreshedAdminData.current = false;
    }
    return undefined;
  }, [isAdminUser, user?.id, refreshAdminData]);

  const unreadCount = useMemo(() => {
    if (!user?.username) return 0;
    try {
      const threads: Record<string, any[]> = {};
      Object.values(messages)
        .flat()
        .forEach((msg: any) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            if (!threads[otherParty]) threads[otherParty] = [];
            threads[otherParty].push(msg);
          }
        });
      let total = 0;
      Object.entries(threads).forEach(([otherUser, msgs]) => {
        const count = msgs.filter((m) => !m.read && m.sender === otherUser && m.receiver === user.username).length;
        total += count;
      });
      return total;
    } catch (error) {
      console.error('Error calculating unread count:', error);
      return 0;
    }
  }, [user?.username, messages]);

  const forceUpdateBalances = useCallback(() => {
    if (!isMountedRef.current) return;
    const now = Date.now();
    if (now - lastBalanceUpdate.current < 1000) return;
    lastBalanceUpdate.current = now;
    setBalanceUpdateTrigger((prev) => prev + 1);
  }, []);

  const checkAuctionsWithRateLimit = useCallback(() => {
    if (!isMountedRef.current) return;
    const now = Date.now();
    if (now - lastAuctionCheck.current < 10000) return;
    lastAuctionCheck.current = now;
    try {
      if (typeof checkEndedAuctions === 'function') {
        checkEndedAuctions();
        setTimeout(() => {
          if (isMountedRef.current) setBalanceUpdateTrigger((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Error checking ended auctions:', err);
    }
  }, [checkEndedAuctions]);

  const updateReportCount = useCallback(() => {
    if (!isAdminUser || !isMountedRef.current) return;
    try {
      const count = getReportCount();
      setReportCount(typeof count === 'number' && !isNaN(count) && count >= 0 ? count : 0);
    } catch (err) {
      console.error('Error updating report count:', err);
      setReportCount(0);
    }
  }, [isAdminUser]);

  // Add these handler functions for notifications
  const handleClearOne = useCallback((notification: UINotification) => {
    if (notification.source === 'legacy') {
      clearSellerNotification(notification.id);
    } else {
      ctxClearNotification(notification.id);
    }
  }, [clearSellerNotification, ctxClearNotification]);

  const handleRestoreOne = useCallback((notification: UINotification) => {
    if (notification.source === 'legacy') {
      restoreSellerNotification(notification.id);
    } else {
      ctxRestoreNotification(notification.id);
    }
  }, [restoreSellerNotification, ctxRestoreNotification]);

  const handleDeleteOne = useCallback((notification: UINotification) => {
    if (notification.source === 'legacy') {
      permanentlyDeleteSellerNotification(notification.id);
    } else {
      ctxDeleteNotification(notification.id);
    }
  }, [permanentlyDeleteSellerNotification, ctxDeleteNotification]);

  const clearAllNotifications = useCallback(() => {
    setClearingNotifications(true);
    processedNotifications.active.forEach((notification) => {
      if (notification.source === 'legacy') {
        clearSellerNotification(notification.id);
      } else {
        ctxClearNotification(notification.id);
      }
    });
    // Also call the context clear all
    ctxClearAll();
    setTimeout(() => setClearingNotifications(false), 500);
  }, [processedNotifications.active, clearSellerNotification, ctxClearNotification, ctxClearAll]);

  const deleteAllClearedNotifications = useCallback(() => {
    setDeletingNotifications(true);
    processedNotifications.cleared.forEach((notification) => {
      if (notification.source === 'legacy') {
        permanentlyDeleteSellerNotification(notification.id);
      } else {
        ctxDeleteNotification(notification.id);
      }
    });
    // Also call the context delete all cleared
    ctxDeleteAllCleared();
    setTimeout(() => setDeletingNotifications(false), 500);
  }, [processedNotifications.cleared, permanentlyDeleteSellerNotification, ctxDeleteNotification, ctxDeleteAllCleared]);

  const clearBalanceInterval = useInterval(() => {
    if (isMountedRef.current) forceUpdateBalances();
  }, 30000);

  const clearAuctionInterval = useInterval(() => {
    if (isMountedRef.current) checkAuctionsWithRateLimit();
  }, 30000);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    isMountedRef.current = true;

    const initTimer = setTimeout(() => {
      if (isMountedRef.current) {
        updateReportCount();
        forceUpdateBalances();
        checkAuctionsWithRateLimit();
      }
    }, 100);

    const handleUpdateReports = () => isMountedRef.current && updateReportCount();
    const handleAuctionEnd = () => isMountedRef.current && forceUpdateBalances();
    const handleWalletUpdate = () => isMountedRef.current && forceUpdateBalances();

    window.addEventListener('updateReports', handleUpdateReports);
    window.addEventListener('auctionEnded', handleAuctionEnd);
    window.addEventListener('walletUpdated', handleWalletUpdate as EventListener);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimer);
      clearBalanceInterval();
      clearAuctionInterval();
      window.removeEventListener('updateReports', handleUpdateReports);
      window.removeEventListener('auctionEnded', handleAuctionEnd);
      window.removeEventListener('walletUpdated', handleWalletUpdate as EventListener);
    };
  }, []); // once

  useEffect(() => {
    if (showNotifDropdown) setActiveNotifTab('active');
  }, [showNotifDropdown]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const renderMobileLink = (href: string, icon: React.ReactNode, label: string, badge?: number) => (
    <Link
      href={href}
      className="flex items-center gap-3 text-[#ff950e] hover:bg-[#ff950e]/10 p-3 rounded-lg transition-all duration-200 hover:translate-x-1"
      onClick={() => setMobileMenuOpen(false)}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex items-center justify-center w-8 h-8 bg-[#ff950e]/10 rounded-lg">
        {icon}
      </div>
      <span className="flex-1">{label}</span>
      {badge && badge > 0 && (
        <span className="bg-[#ff950e] text-black text-xs rounded-full px-2 py-0.5 min-w-[24px] text-center font-bold animate-pulse">
          {badge}
        </span>
      )}
    </Link>
  );

  const MobileNotificationsPanel = () => (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#111] z-10 flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-[#ff950e]/30">
        <button
          onClick={() => setShowMobileNotifications(false)}
          className="text-[#ff950e] hover:text-white transition-colors"
          aria-label="Back to menu"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <h3 className="text-[#ff950e] font-bold flex-1">Notifications</h3>
        {activeNotifTab === 'active' && processedNotifications.active.length > 0 && (
          <button
            onClick={clearAllNotifications}
            disabled={clearingNotifications}
            className="text-xs text-white hover:text-[#ff950e] px-2 py-1 rounded bg-black/20 hover:bg-[#ff950e]/10 border border-white/20 hover:border-[#ff950e]/30"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveNotifTab('active')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeNotifTab === 'active' ? 'text-[#ff950e] bg-[#ff950e]/10' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Active ({processedNotifications.active.length})
          {activeNotifTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]" />}
        </button>
        <button
          onClick={() => setActiveNotifTab('cleared')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeNotifTab === 'cleared' ? 'text-[#ff950e] bg-[#ff950e]/10' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Cleared ({processedNotifications.cleared.length})
          {activeNotifTab === 'cleared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeNotifTab === 'active' ? (
          processedNotifications.active.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No active notifications</div>
          ) : (
            processedNotifications.active.map((notification, i) => (
              <div key={notification.id || i} className="p-4 border-b border-gray-800 hover:bg-[#222]/50 transition-colors">
                <SecureMessageDisplay content={notification.message} className="text-gray-200 text-sm leading-relaxed" allowBasicFormatting={false} />
                {notification.timestamp && (
                  <div className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</div>
                )}
                <button
                  onClick={() => handleClearOne(notification)}
                  className="text-xs text-[#ff950e] hover:text-[#ff6b00] font-bold mt-2"
                >
                  Clear
                </button>
              </div>
            ))
          )
        ) : processedNotifications.cleared.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No cleared notifications</div>
        ) : (
          processedNotifications.cleared.map((notification, i) => (
            <div key={notification.id || `cleared-${i}`} className="p-4 border-b border-gray-800 hover:bg-[#222]/50 transition-colors">
              <SecureMessageDisplay content={notification.message} className="text-gray-400 text-sm leading-relaxed" allowBasicFormatting={false} />
              {notification.timestamp && (
                <div className="text-xs text-gray-600 mt-2">{new Date(notification.timestamp).toLocaleString()}</div>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleRestoreOne(notification)}
                  className="text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => handleDeleteOne(notification)}
                  className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const MobileMenu = () => (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      {/* Menu Panel */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-gradient-to-b from-[#1a1a1a] to-[#111] border-l border-[#ff950e]/30 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {showMobileNotifications && role === 'seller' ? (
          <MobileNotificationsPanel />
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#ff950e]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="PantyPost" className="w-8 h-auto" />
                  <span className="text-[#ff950e] font-bold">PantyPost</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#ff950e] hover:text-white transition-colors p-2"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* User Info Section */}
            {user && (
              <div className="p-4 bg-[#ff950e]/5 border-b border-[#ff950e]/20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#ff950e]/20 rounded-full">
                    {role === 'seller' && <Heart className="w-5 h-5 text-[#ff950e]" />}
                    {role === 'buyer' && <ShoppingBag className="w-5 h-5 text-[#ff950e]" />}
                    {isAdminUser && <Crown className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div>
                    <div className="text-[#ff950e] font-bold">{username}</div>
                    <div className="text-gray-400 text-xs capitalize">{isAdminUser ? 'Admin' : role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {renderMobileLink('/browse', <ShoppingBag className="w-5 h-5" />, 'Browse')}

              {isAdminUser && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/20 rounded-lg mt-4 mb-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 font-bold text-sm">ADMIN PANEL</span>
                  </div>
                  {renderMobileLink('/admin/reports', <Shield className="w-5 h-5" />, 'Reports', reportCount)}
                  {renderMobileLink('/admin/bans', <Ban className="w-5 h-5" />, 'Bans')}
                  {renderMobileLink('/admin/resolved', <ShieldCheck className="w-5 h-5" />, 'Resolved')}
                  {renderMobileLink('/admin/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
                  {renderMobileLink('/admin/verification-requests', <ClipboardCheck className="w-5 h-5" />, 'Verify')}
                  {renderMobileLink('/admin/wallet-management', <DollarSign className="w-5 h-5" />, 'Wallets')}
                  {renderMobileLink('/wallet/admin', <WalletIcon className="w-5 h-5" />, `Platform: $${platformBalance.toFixed(2)}`)}
                </>
              )}

              {role === 'seller' && !isAdminUser && (
                <>
                  <div className="pt-2 pb-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wider px-3">Seller Menu</span>
                  </div>
                  {renderMobileLink('/sellers/my-listings', <Package className="w-5 h-5" />, 'My Listings')}
                  {renderMobileLink('/sellers/profile', <User className="w-5 h-5" />, 'Profile')}
                  {renderMobileLink('/sellers/verify', <ShieldCheck className="w-5 h-5 text-green-400" />, 'Get Verified')}
                  {renderMobileLink('/sellers/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
                  {renderMobileLink('/sellers/subscribers', <Users className="w-5 h-5" />, 'Analytics')}
                  {renderMobileLink('/sellers/orders-to-fulfil', <Package className="w-5 h-5" />, 'Orders to Fulfil', pendingOrdersCount)}
                  {renderMobileLink('/wallet/seller', <WalletIcon className="w-5 h-5" />, `Wallet: $${Math.max(sellerBalance, 0).toFixed(2)}`)}
                  
                  {/* Notifications for Sellers */}
                  <button
                    onClick={() => setShowMobileNotifications(true)}
                    className="flex items-center gap-3 text-[#ff950e] hover:bg-[#ff950e]/10 p-3 rounded-lg transition-all duration-200 hover:translate-x-1 w-full"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-[#ff950e]/10 rounded-lg relative">
                      <Bell className="w-5 h-5" />
                      {processedNotifications.active.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#ff950e] text-black text-[10px] rounded-full px-1.5 py-0.5 min-w-[16px] text-center font-bold">
                          {processedNotifications.active.length}
                        </span>
                      )}
                    </div>
                    <span className="flex-1">Notifications</span>
                    {processedNotifications.active.length > 0 && (
                      <span className="bg-[#ff950e] text-black text-xs rounded-full px-2 py-0.5 min-w-[24px] text-center font-bold animate-pulse">
                        {processedNotifications.active.length}
                      </span>
                    )}
                  </button>
                </>
              )}

              {role === 'buyer' && !isAdminUser && (
                <>
                  <div className="pt-2 pb-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wider px-3">Buyer Menu</span>
                  </div>
                  {renderMobileLink('/buyers/dashboard', <User className="w-5 h-5" />, 'Dashboard')}
                  {renderMobileLink('/buyers/my-orders', <Package className="w-5 h-5" />, 'My Orders')}
                  {renderMobileLink('/buyers/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
                  {renderMobileLink('/wallet/buyer', <WalletIcon className="w-5 h-5" />, `Wallet: $${Math.max(buyerBalance, 0).toFixed(2)}`)}
                </>
              )}

              {!user && (
                <>
                  <div className="pt-4 space-y-2">
                    <Link
                      href="/login"
                      className="block text-center bg-gradient-to-r from-[#2a2a2a] to-[#333] hover:from-[#333] hover:to-[#444] text-white font-bold px-4 py-3 rounded-lg transition-all duration-300 border border-[#444] hover:border-[#555]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="block text-center bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-bold px-4 py-3 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}

              {user && (
                <div className="pt-4 mt-4 border-t border-[#ff950e]/20">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 text-red-400 hover:bg-red-900/20 p-3 rounded-lg transition-all duration-200 w-full"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-red-900/20 rounded-lg">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </nav>
          </>
        )}
      </div>
    </>
  );

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <>
      <header className="bg-gradient-to-r from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white shadow-2xl px-4 lg:px-6 py-3 flex justify-between items-center z-40 relative border-b border-[#ff950e]/20 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <img src="/logo.png" alt="PantyPost Logo" className="relative w-16 lg:w-24 h-auto drop-shadow-2xl transform group-hover:scale-105 transition duration-300" />
          </div>
        </Link>

        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff6b00] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <nav className={`${isMobile ? 'hidden' : 'flex'} items-center gap-x-2`}>
          <Link
            href="/browse"
            className="group flex items-center gap-1.5 bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 shadow-lg hover:shadow-[#ff950e]/20 text-xs"
          >
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

              <Link
                href="/admin/bans"
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/20 to-red-900/20 hover:from-purple-900/30 hover:to-red-900/30 text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 text-xs"
              >
                <Ban className="w-3.5 h-3.5 text-purple-400" />
                <span>Bans</span>
              </Link>

              <Link
                href="/admin/resolved"
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                <span>Resolved</span>
              </Link>

              <Link
                href="/admin/messages"
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs relative"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/verification-requests"
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-yellow-400" />
                <span>Verify</span>
              </Link>

              <Link
                href="/admin/wallet-management"
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#444] text-xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                <span>Wallets</span>
              </Link>

              <Link
                href="/wallet/admin"
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-900/20 to-pink-900/20 hover:from-purple-900/30 hover:to-pink-900/30 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/admin';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <WalletIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-300">${platformBalance.toFixed(2)}</span>
              </Link>
            </>
          )}

          {role === 'seller' && !isAdminUser && (
            <>
              {/* Correct order: Browse, My Listings, Profile, Get Verified, Messages, Analytics, Wallet, Orders to Fulfil, Bell, Username, Logout */}
              
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
                <span>Analytics</span>
              </Link>

              <Link
                href="/wallet/seller"
                className="group flex items-center gap-1.5 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#ff950e]/30 hover:border-[#ff950e]/50 shadow-lg text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/seller';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <WalletIcon className="w-3.5 h-3.5 text-[#ff950e]" />
                <span className="font-bold text-[#ff950e]">${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </Link>

              <Link href="/sellers/orders-to-fulfil" className="relative group flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-[#ff950e] px-3 py-1.5 rounded-lg transition-all duration-300 border border-[#333] hover:border-[#ff950e]/50 text-xs">
                <Package className="w-3.5 h-3.5 group-hover:text-[#ff950e] transition-colors" />
                <span>Orders to Fulfil</span>
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>

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
                          activeNotifTab === 'active' ? 'text-[#ff950e] bg-[#ff950e]/10' : 'text-gray-400 hover:text-gray-300 hover:bg-[#222]/50'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Active ({processedNotifications.active.length})
                        {activeNotifTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]" />}
                      </button>
                      <button
                        onClick={() => setActiveNotifTab('cleared')}
                        className={`flex-1 px-4 py-2 text-xs font-medium transition-colors relative ${
                          activeNotifTab === 'cleared' ? 'text-[#ff950e] bg-[#ff950e]/10' : 'text-gray-400 hover:text-gray-300 hover:bg-[#222]/50'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Cleared ({processedNotifications.cleared.length})
                        {activeNotifTab === 'cleared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff950e]" />}
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
                                <SecureMessageDisplay content={notification.message} className="text-gray-200 leading-snug" allowBasicFormatting={false} />
                                {notification.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleClearOne(notification)}
                                className="text-xs text-[#ff950e] hover:text-[#ff6b00] font-bold transition-colors whitespace-nowrap"
                                style={{ touchAction: 'manipulation' }}
                              >
                                Clear
                              </button>
                            </li>
                          ))
                        )
                      ) : processedNotifications.cleared.length === 0 ? (
                        <li className="p-4 text-sm text-center text-gray-400">No cleared notifications</li>
                      ) : (
                        processedNotifications.cleared.map((notification, i) => (
                          <li key={notification.id || `cleared-${i}`} className="flex justify-between items-start p-3 text-sm hover:bg-[#222]/50 transition-colors">
                            <div className="flex-1 pr-2">
                              <SecureMessageDisplay content={notification.message} className="text-gray-400 leading-snug" allowBasicFormatting={false} />
                              {notification.timestamp && <div className="text-xs text-gray-600 mt-1">{new Date(notification.timestamp).toLocaleString()}</div>}
                            </div>
                            <div className="flex gap-2 flex-col">
                              <button
                                onClick={() => handleRestoreOne(notification)}
                                className="text-xs text-green-400 hover:text-green-300 font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                                title="Restore notification"
                                style={{ touchAction: 'manipulation' }}
                              >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                              </button>
                              <button
                                onClick={() => handleDeleteOne(notification)}
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

              <Link
                href="/wallet/buyer"
                className="group flex items-center gap-1.5 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-600/30 hover:to-purple-700/30 text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 shadow-lg text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/buyer';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <WalletIcon className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-purple-400">${Math.max(buyerBalance, 0).toFixed(2)}</span>
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
                <span className="text-gray-400 text-[10px]">({isAdminUser ? 'admin' : role})</span>
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
