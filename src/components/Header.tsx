// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useMessages, getReportCount } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Bell, ShoppingBag, MessageSquare, Users, User, LogOut, Package, ClipboardCheck, DollarSign, Crown, Shield, RotateCcw, Trash2, Ban, Menu, X, Compass, AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { storageService } from '@/services';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeUrl } from '@/utils/security/sanitization';
import { resolveApiUrl } from '@/utils/url';
import { isAdmin } from '@/utils/security/permissions';
import { useNotifications } from '@/context/NotificationContext';
import { approvalService } from '@/services/approval.service';
import dynamic from 'next/dynamic';

// OPTIMIZED: Lazy load HeaderSearch to reduce initial bundle
const HeaderSearch = dynamic(() => import('@/components/HeaderSearch').then(mod => ({ default: mod.HeaderSearch })), {
  ssr: false,
  loading: () => null
});

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

// OPTIMIZED: Memoized mobile link component to prevent re-renders
const MobileLink = memo(({ 
  href, 
  icon, 
  label, 
  badge, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  badge?: number;
  onClick: () => void;
}) => (
  <Link
    href={href}
    className="flex items-center gap-3 text-[#ff950e] hover:bg-[#ff950e]/10 p-3 rounded-lg transition-all duration-200 hover:translate-x-1"
    onClick={onClick}
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
));
MobileLink.displayName = 'MobileLink';

export default function Header(): React.ReactElement | null {
  const pathname = usePathname();
  const router = useRouter();
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

  /* Drives the body scroll-lock effect ONLY. Render must never branch
     on this: it is `false` during SSR and on every fresh mount, so any
     `isMobile ? â€¦ : â€¦` in JSX paints one desktop frame first â€” which is
     exactly the flash of desktop nav buttons iPhones showed when leaving
     a chat (ClientLayout remounts this header when the thread closes).
     Mobile/desktop visibility in the markup is pure CSS (md:hidden /
     hidden md:flex), which is correct from the very first frame. */
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
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

  // OPTIMIZED: Memoize computed values to prevent re-calculations
  const isAdminUser = useMemo(() => isAdmin(user), [user]);
  const role = useMemo(() => user?.role ?? null, [user?.role]);
  const isSellerVerified = useMemo(
    () => user?.role === 'seller' && (user?.isVerified === true || user?.verificationStatus === 'verified'),
    [user?.role, user?.isVerified, user?.verificationStatus]
  );
  const canUseSearch = useMemo(() => Boolean(user && (isAdminUser || role === 'buyer' || role === 'seller')), [user, isAdminUser, role]);
  const username = useMemo(() => (user?.username ? sanitizeStrict(user.username) : ''), [user?.username]);
  const profileHref = useMemo(() => {
    if (!user || isAdminUser) {
      return null;
    }

    if (role === 'seller') {
      return '/sellers/profile';
    }

    if (role === 'buyer' && username) {
      return `/buyers/${username}`;
    }

    return null;
  }, [user, isAdminUser, role, username]);
  
  const profileImageSrc = useMemo(() => {
    if (!user) {
      return null;
    }

    const rawProfilePictureValues: Array<string | null> = [
      typeof user.profilePicture === 'string' ? user.profilePicture : null,
      (() => {
        const candidate = (user as unknown as Record<string, unknown>).profilePic;
        return typeof candidate === 'string' ? candidate : null;
      })(),
    ];

    const profilePictureCandidates = rawProfilePictureValues.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );

    if (profilePictureCandidates.length === 0) {
      return null;
    }

    const normalizedProfilePicture = (() => {
      const [rawCandidate] = profilePictureCandidates;
      const raw = rawCandidate.trim();
      if (
        raw.startsWith('http://') ||
        raw.startsWith('https://') ||
        raw.startsWith('/') ||
        raw.startsWith('data:')
      ) {
        return raw;
      }
      return `/${raw.replace(/^\/+/, '')}`;
    })();

    const sanitized = sanitizeUrl(normalizedProfilePicture);
    if (!sanitized) {
      return null;
    }

    const resolved = resolveApiUrl(sanitized) ?? sanitized;

    const profileUpdatedAt = (() => {
      const extendedUser = user as unknown as Record<string, unknown>;
      const updatedAtCandidates = [
        extendedUser.profilePictureUpdatedAt,
        extendedUser.profilePicUpdatedAt,
        extendedUser.profilePicLastUpdated,
      ];
      for (const value of updatedAtCandidates) {
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
      return null;
    })();

    if (!profileUpdatedAt) {
      return resolved;
    }

    const separator = resolved.includes('?') ? '&' : '?';
    return `${resolved}${separator}v=${encodeURIComponent(profileUpdatedAt)}`;
  }, [user]);
  
  const canDisplayUserAvatar = useMemo(() => role === 'buyer' || role === 'seller', [role]);
  const profileAvatarSrc = useMemo(() => (canDisplayUserAvatar ? profileImageSrc ?? null : null), [canDisplayUserAvatar, profileImageSrc]);
  const showAvatarImage = useMemo(() => canDisplayUserAvatar && Boolean(profileAvatarSrc), [canDisplayUserAvatar, profileAvatarSrc]);
  const avatarAltText = useMemo(() => (username ? `${username}'s avatar` : 'User avatar'), [username]);

  useClickOutside(notifRef, () => setShowNotifDropdown(false));
  useClickOutside(mobileMenuRef, () => {
    setMobileMenuOpen(false);
    setShowMobileNotifications(false);
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Body scroll lock for mobile menu only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Only lock when mobile menu or notifications are open
    if (isMobile && (mobileMenuOpen || showMobileNotifications)) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileMenuOpen, showMobileNotifications]);

  const pendingOrdersCount = useMemo(() => {
    if (!user?.username || user.role !== 'seller') return 0;
    
    try {
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
      
      if (sanitizedMessage.match(/^[Ã°Å¸Å½â€°Ã°Å¸â€™Â¸Ã°Å¸â€™Â°Ã°Å¸â€ºâ€™Ã°Å¸â€Â¨Ã¢Å¡Â Ã¯Â¸ÂÃ¢â€žÂ¹Ã¯Â¸ÂÃ°Å¸â€ºâ€˜Ã°Å¸Ââ€ Ã°Å¸â€ºÂÃ¯Â¸Â]/)) {
        return sanitizedMessage;
      }
      
      if (sanitizedMessage.includes('subscribed to you')) return `Ã°Å¸Å½â€° ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Tip received') || sanitizedMessage.includes('tipped you')) return `Ã°Å¸â€™Â¸ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('New custom order')) return `Ã°Å¸â€ºâ€™ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('New bid')) return `Ã°Å¸â€™Â° ${sanitizedMessage}`;
      if (sanitizedMessage.includes('created a new auction')) return `Ã°Å¸â€Â¨ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('cancelled your auction')) return `Ã°Å¸â€ºâ€˜ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Reserve price not met')) return `Ã°Å¸â€Â¨ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('No bids were placed')) return `Ã°Å¸â€Â¨ ${sanitizedMessage}`;
      if (sanitizedMessage.includes('insufficient funds') || sanitizedMessage.includes('payment error')) return `Ã¢Å¡Â Ã¯Â¸Â ${sanitizedMessage}`;
      if (sanitizedMessage.includes('Original highest bidder')) return `Ã¢â€žÂ¹Ã¯Â¸Â ${sanitizedMessage}`;
      
      return sanitizedMessage;
    };

    const deduplicateNotifications = (notifications: UINotification[]): UINotification[] => {
      const seen = new Map<string, UINotification>();
      const deduped: UINotification[] = [];

      for (const n of notifications) {
        const cleanMessage = (n.message || '').replace(/^[Ã°Å¸Å½â€°Ã°Å¸â€™Â¸Ã°Å¸â€™Â°Ã°Å¸â€ºâ€™Ã°Å¸â€Â¨Ã¢Å¡Â Ã¯Â¸ÂÃ¢â€žÂ¹Ã¯Â¸ÂÃ°Å¸â€ºâ€˜Ã°Å¸Ââ€ Ã°Å¸â€ºÂÃ¯Â¸Â]\s*/, '').trim();
        const timestamp = new Date(n.timestamp || Date.now());
        const timeWindow = Math.floor(timestamp.getTime() / (60 * 1000));
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
        /* Both flags have to be falsy.
           
           The API returns `isRead`; only the websocket path and the local
           mark-as-read set `read`. Checking `read` alone Ã¢â‚¬â€ as this did Ã¢â‚¬â€
           counts every already-read message the server told us about,
           because `read` is simply undefined on anything that arrived via
           a normal fetch. MessageContext's own per-thread count already
           tests both (see getAllThreadsInfo); this now agrees with it
           instead of contradicting it. */
        const count = msgs.filter(
          (m) => !m.read && !m.isRead && m.sender === otherUser && m.receiver === user.username
        ).length;
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

  // Pending-moderation badge. Exists because the queue is invisible
  // unless an admin thinks to open /admin/approval Ã¢â‚¬â€ content sat
  // unreviewed for days purely for lack of a signal. Polling plus a
  // focus refresh is deliberately boring: a websocket event would be
  // fancier, but a 60s-stale count on a moderation badge is fine and
  // this cannot break when the socket does.
  const refreshApprovalCount = useCallback(async () => {
    if (!isAdminUser || !isMountedRef.current) return;
    try {
      const resp = await approvalService.getPendingCounts();
      if (isMountedRef.current && resp.success && resp.data) {
        const total = Number(resp.data.total);
        setApprovalCount(Number.isFinite(total) && total > 0 ? total : 0);
      }
    } catch {
      // Best-effort: keep the last known count rather than flashing 0.
    }
  }, [isAdminUser]);

  useEffect(() => {
    if (!isAdminUser) {
      setApprovalCount(0);
      return;
    }
    void refreshApprovalCount();
    const interval = setInterval(() => void refreshApprovalCount(), 60_000);
    const onFocus = () => void refreshApprovalCount();

    /* Refresh the moment something is approved or denied.
       Polling every 60s and on focus covered another admin acting, or
       this tab being returned to -- but not the common case: the admin
       approving something right here, in this window. Focus never
       changes, so the badge stayed stale for up to a minute and read as
       broken. The approval page fires this event; see
       APPROVAL_COUNT_CHANGED in app/admin/approval/page.tsx. */
    const onApprovalChange = () => void refreshApprovalCount();

    window.addEventListener('focus', onFocus);
    window.addEventListener('pantypost:approval-count-changed', onApprovalChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pantypost:approval-count-changed', onApprovalChange);
    };
  }, [isAdminUser, refreshApprovalCount]);

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
  }, []);

  useEffect(() => {
    if (showNotifDropdown) setActiveNotifTab('active');
  }, [showNotifDropdown]);

  // OPTIMIZED: Memoize mobile menu close handler
  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
    setShowMobileNotifications(false);
  }, []);

  const renderMobileLink = useCallback((href: string, icon: React.ReactNode, label: string, badge?: number) => (
    <MobileLink key={href} href={href} icon={icon} label={label} badge={badge} onClick={handleMobileMenuClose} />
  ), [handleMobileMenuClose]);

  const MobileNotificationsPanel = () => (
    <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#111] z-[110] flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-primary-line">
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
            className="text-xs text-white hover:text-[#ff950e] px-2 py-1 rounded bg-black/20 hover:bg-[#ff950e]/10 border border-white/20 hover:border-primary-line"
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
              <div key={notification.id || i} className="p-4 border-b border-gray-800 hover:bg-surface-hover transition-colors">
                <SecureMessageDisplay content={notification.message} className="text-gray-200 text-sm leading-relaxed" allowBasicFormatting={false} />
                {notification.timestamp && (
                  <div className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</div>
                )}
                <button
                  onClick={() => handleClearOne(notification)}
                  className="text-xs text-[#ff950e] hover:text-primary-hover font-bold mt-2"
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
            <div key={notification.id || `cleared-${i}`} className="p-4 border-b border-gray-800 hover:bg-surface-hover transition-colors">
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
      {/* Increased z-index for overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleMobileMenuClose}
      />
      
      {/* Increased z-index for menu content */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-gradient-to-b from-[#1a1a1a] to-[#111] border-l border-primary-line z-[100] lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {showMobileNotifications && role === 'seller' ? (
          <MobileNotificationsPanel />
        ) : (
          <>
            <div className="relative p-6 border-b border-primary-line">
              <button
                onClick={handleMobileMenuClose}
                className="absolute top-4 right-4 text-[#ff950e] hover:text-white transition-colors p-2 z-10"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-center">
                {/* OPTIMIZED: Use Next.js Image component with priority for mobile menu logo */}
                <Image
                  src="/logo.png"
                  alt="Panty Post - Used Panties Marketplace"
                  width={80}
                  height={80}
                  priority
                  quality={90}
                  className="w-20 h-auto drop-shadow-2xl"
                />
              </div>
            </div>

            {user && (
              profileHref ? (
                <Link
                  href={profileHref}
                  onClick={handleMobileMenuClose}
                  className="flex items-center gap-3 p-4 bg-[#ff950e]/5 border-b border-[#ff950e]/20 transition-colors duration-200 hover:bg-[#ff950e]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {showAvatarImage ? (
                    <SecureImage
                      src={profileAvatarSrc!}
                      alt={avatarAltText}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary-line shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 bg-[#ff950e]/20 rounded-full">
                      {isAdminUser ? (
                        <Crown className="w-5 h-5 text-purple-400" />
                      ) : (
                        <User className="w-5 h-5 text-[#ff950e]" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="text-[#ff950e] font-bold">{username}</div>
                    <div className="text-gray-400 text-xs capitalize">{isAdminUser ? 'Admin' : role}</div>
                  </div>
                </Link>
              ) : (
                <div className="p-4 bg-[#ff950e]/5 border-b border-[#ff950e]/20">
                  <div className="flex items-center gap-3">
                    {showAvatarImage ? (
                      <SecureImage
                        src={profileAvatarSrc!}
                        alt={avatarAltText}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary-line shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 bg-[#ff950e]/20 rounded-full">
                        {isAdminUser ? (
                          <Crown className="w-5 h-5 text-purple-400" />
                        ) : (
                          <User className="w-5 h-5 text-[#ff950e]" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="text-[#ff950e] font-bold">{username}</div>
                      <div className="text-gray-400 text-xs capitalize">{isAdminUser ? 'Admin' : role}</div>
                    </div>
                  </div>
                </div>
              )
            )}

            {canUseSearch && (
              <div className="p-4 border-b border-[#ff950e]/20">
                <HeaderSearch 
                  variant="mobile" 
                  canUseSearch={canUseSearch}
                  onResultClick={handleMobileMenuClose}
                />
              </div>
            )}

            <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              {renderMobileLink('/browse', <ShoppingBag className="w-5 h-5" />, 'Browse')}
              {renderMobileLink('/explore', <Compass className="w-5 h-5" />, 'Explore')}

              {isAdminUser && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/20 rounded-lg mt-4 mb-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 font-bold text-sm">ADMIN PANEL</span>
                  </div>
                  {renderMobileLink('/admin/reports', <Shield className="w-5 h-5" />, 'Reports', reportCount)}
                  {renderMobileLink('/admin/complaints', <AlertTriangle className="w-5 h-5" />, 'Complaints')}
                  {renderMobileLink('/admin/traffic', <BarChart3 className="w-5 h-5" />, 'Traffic')}
                  {renderMobileLink('/admin/approval', <ClipboardCheck className="w-5 h-5" />, 'Approval', approvalCount)}
                  {renderMobileLink('/admin/bans', <Ban className="w-5 h-5" />, 'Bans')}
                  {renderMobileLink('/admin/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
                  {renderMobileLink('/admin/verification-requests', <ClipboardCheck className="w-5 h-5" />, 'Verify')}
                  {renderMobileLink('/admin/wallet-management', <DollarSign className="w-5 h-5" />, 'Wallets')}
                  {renderMobileLink('/admin/withdrawals', <DollarSign className="w-5 h-5" />, 'Withdrawals')}
                  {renderMobileLink(
                    '/wallet/admin',
                    <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />,
                    `Platform: $${platformBalance.toFixed(2)}`
                  )}
                </>
              )}

              {role === 'seller' && !isAdminUser && (
                <>
                  <div className="pt-2 pb-1">
                    <span className="text-xs text-gray-400 uppercase tracking-wider px-3">Seller Menu</span>
                  </div>
                  {renderMobileLink('/sellers/my-listings', <Package className="w-5 h-5" />, 'My Listings')}
                  {/* Same rule as desktop: only while there is something
                      to do. Also drops /verification_badge.png, which
                      404s. */}
                  {!isSellerVerified &&
                    renderMobileLink(
                      '/sellers/verify',
                      <ShieldCheck className="w-5 h-5" />,
                      'Get Verified'
                    )}
                  {renderMobileLink('/sellers/messages', <MessageSquare className="w-5 h-5" />, 'Messages', unreadCount)}
                  {renderMobileLink('/sellers/subscribers', <Users className="w-5 h-5" />, 'Analytics')}
                  {renderMobileLink('/sellers/orders-to-fulfil', <Package className="w-5 h-5" />, 'Orders to Fulfil', pendingOrdersCount)}
                  {renderMobileLink(
                    '/wallet/seller',
                    <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />,
                    `Wallet: $${Math.max(sellerBalance, 0).toFixed(2)}`
                  )}
                  
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
                  {renderMobileLink(
                    '/wallet/buyer',
                    <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />,
                    `Wallet: $${Math.max(buyerBalance, 0).toFixed(2)}`
                  )}
                </>
              )}

              {!user && (
                <>
                  <div className="pt-4 space-y-2">
                    <Link
                      href="/login"
                      className="block text-center bg-gradient-to-r from-[#2a2a2a] to-[#333] hover:from-[#333] hover:to-[#444] text-white font-bold px-4 py-3 rounded-lg transition-all duration-300 border border-[#444] hover:border-[#555]"
                      onClick={handleMobileMenuClose}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="block text-center bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] font-bold px-4 py-3 rounded-lg transition-all duration-300 shadow-[0_0_30px_rgba(255,149,14,0.35)] hover:shadow-[0_0_45px_rgba(255,149,14,0.45)]"
                      onClick={handleMobileMenuClose}
                      style={{ color: '#2a2a2a' }}
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
                      handleMobileMenuClose();
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
      <header className="bg-gradient-to-r from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white shadow-2xl px-4 lg:px-6 py-3 flex items-center gap-3 w-full z-40 relative border-b border-[#ff950e]/20 backdrop-blur-sm">
        <Link href="/" className="flex shrink-0 items-center gap-3 group">
          <div className="relative">
            {/* OPTIMIZED: Use Next.js Image with priority */}
            <Image
              src="/logo.png"
              alt="Panty Post - Used Panties Marketplace"
              width={96}
              height={96}
              priority
              quality={90}
              className="relative w-16 lg:w-24 h-auto transform group-hover:scale-105 transition duration-300"
            />
          </div>
        </Link>

        {canUseSearch && (
          <div className="hidden md:flex flex-1 px-2 max-w-[220px] xl:px-4 xl:max-w-md">
            <HeaderSearch 
              variant="desktop" 
              canUseSearch={canUseSearch} 
            />
          </div>
        )}

        <div className="flex min-w-0 items-center gap-2 ml-auto">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex md:hidden items-center justify-center w-10 h-10 bg-primary text-black rounded-sm hover:bg-[#ff6b00] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <nav className="hidden md:flex items-center gap-x-1 xl:gap-x-2">
          <Link
            href="/browse"
            className="group flex items-center gap-1.5 whitespace-nowrap bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 transition-colors duration-300 group-hover:text-primary" />
            <span className="sr-only xl:not-sr-only xl:inline">Browse</span>
          </Link>

          <Link
            href="/explore"
            className="group flex items-center gap-1.5 whitespace-nowrap bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs"
          >
            <Compass className="w-3.5 h-3.5 transition-colors duration-300 group-hover:text-primary" />
            <span className="sr-only xl:not-sr-only xl:inline">Explore</span>
          </Link>

          {isAdminUser && (
            <>
              <div className="relative flex items-center">
                <Link
                  href="/admin/reports"
                title="Reports"
                  className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
                >
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span className="sr-only">Reports</span>
                  {reportCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-pulse">
                      {reportCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Complaints carry a published resolution deadline, so this
                  sits beside Reports rather than being buried in a submenu. */}
              <Link
                href="/admin/complaints"
                title="Complaints"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="sr-only">Complaints</span>
              </Link>

              {/* First-party site analytics. */}
              <Link
                href="/admin/traffic"
                title="Traffic"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                <span className="sr-only">Traffic</span>
              </Link>

              <Link
                href="/admin/approval"
                title="Approval"
                className="relative flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-purple-300" />
                <span className="sr-only">Approval</span>
                {approvalCount > 0 && (
                  /* Black on the accent Ã¢â‚¬â€ white here is 2.20:1 and fails. */
                  <span className="absolute -top-2 -right-2 min-w-[18px] rounded-full border-2 border-white bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-black">
                    {approvalCount > 99 ? '99+' : approvalCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/bans"
                title="Bans"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs"
              >
                <Ban className="w-3.5 h-3.5 text-purple-400" />
                <span className="sr-only">Bans</span>
              </Link>

              <Link
                href="/admin/messages"
                title="Messages"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line-strong text-xs relative"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span className="sr-only">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/admin/verification-requests"
                title="Verify"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line-strong text-xs"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-yellow-400" />
                <span className="sr-only">Verify</span>
              </Link>

              <Link
                href="/admin/wallet-management"
                title="Wallets"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line-strong text-xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-green-400" />
                <span className="sr-only">Wallets</span>
              </Link>

              <Link
                href="/admin/withdrawals"
                title="Withdrawals"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line-strong text-xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="sr-only">Withdrawals</span>
              </Link>

              <Link
                href="/wallet/admin"
                className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-white px-2.5 py-1.5 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/admin';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />
                <span className="font-bold text-purple-300">${platformBalance.toFixed(2)}</span>
              </Link>
            </>
          )}

          {role === 'seller' && !isAdminUser && (
            <>
              <Link href="/sellers/my-listings" className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                <Package className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">My Listings</span>
              </Link>

              {/* Shown ONLY while unverified.
                  "Get Verified" is a call to action: it unlocks listings
                  and auctions, so it earns a permanent slot. "Verified!"
                  does not -- it told a seller something they already knew,
                  on every page, forever, in a header that runs out of room
                  at laptop widths. Settled status now lives on the profile,
                  which is where someone goes to check their own standing.

                  It also used /verification_badge.png, which 404s, so
                  verified sellers were seeing a broken image announcing
                  their verification. Now a lucide icon. */}
              {!isSellerVerified && (
                <Link
                  href="/sellers/verify"
                  className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-colors duration-200 border border-line hover:border-primary-line text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="sr-only xl:not-sr-only xl:inline">Get Verified</span>
                </Link>
              )}

              <Link href="/sellers/messages" className="relative group">
                <div className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                  <MessageSquare className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  <span className="sr-only xl:not-sr-only xl:inline">Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link href="/sellers/subscribers" className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                <Users className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">Analytics</span>
              </Link>

              <Link
                href="/wallet/seller"
                className="group flex items-center gap-1.5 whitespace-nowrap bg-surface-raised hover:bg-surface-hover text-white px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/seller';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />
                <span className="font-bold text-purple-100">${Math.max(sellerBalance, 0).toFixed(2)}</span>
              </Link>

              <Link href="/sellers/orders-to-fulfil" className="relative group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                <Package className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">Orders to Fulfil</span>
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-pulse">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>

              {/* Increased z-index for notification dropdown */}
              <div className="relative flex items-center" ref={notifRef}>
                <button
                  onClick={() => setShowNotifDropdown((prev) => !prev)}
                  className="relative flex items-center justify-center w-10 h-10 bg-primary border border-white rounded-full shadow hover:scale-105 transition hover:bg-primary-hover"
                  aria-label="Notifications"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Bell className="w-6 h-6 text-black" />
                  {processedNotifications.active.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-primary font-bold shadow-lg">
                      {processedNotifications.active.length}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 top-12 w-80 bg-surface-raised text-white rounded-md shadow-raised z-[100] border border-line">
                    <div className="bg-surface-raised px-3 py-1.5 xl:px-4 xl:py-2 border-b border-primary-line">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-primary">Notifications</h3>
                        {activeNotifTab === 'active' && processedNotifications.active.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            disabled={clearingNotifications}
                            className="text-xs text-white hover:text-primary font-medium transition-colors px-2 py-1 rounded bg-black/20 hover:bg-primary/10 border border-white/20 hover:border-primary-line disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ touchAction: 'manipulation' }}
                          >
                            {clearingNotifications ? 'Clearing...' : 'Clear All'}
                          </button>
                        )}
                        {activeNotifTab === 'cleared' && processedNotifications.cleared.length > 0 && (
                          <button
                            onClick={deleteAllClearedNotifications}
                            disabled={deletingNotifications}
                            className="text-xs text-white hover:text-red-400 font-medium transition-colors px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/30 border border-line hover:border-primary-line disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`flex-1 px-3 py-1.5 xl:px-4 xl:py-2 text-xs font-medium transition-colors relative ${
                          activeNotifTab === 'active' ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-300 hover:bg-surface-hover'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Active ({processedNotifications.active.length})
                        {activeNotifTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                      </button>
                      <button
                        onClick={() => setActiveNotifTab('cleared')}
                        className={`flex-1 px-3 py-1.5 xl:px-4 xl:py-2 text-xs font-medium transition-colors relative ${
                          activeNotifTab === 'cleared' ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-300 hover:bg-surface-hover'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        Cleared ({processedNotifications.cleared.length})
                        {activeNotifTab === 'cleared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                      </button>
                    </div>

                    <ul className="divide-y divide-gray-800 max-h-64 overflow-y-auto overscroll-contain">
                      {activeNotifTab === 'active' ? (
                        processedNotifications.active.length === 0 ? (
                          <li className="p-4 text-sm text-center text-gray-400">No active notifications</li>
                        ) : (
                          processedNotifications.active.map((notification, i) => (
                            <li key={notification.id || i} className="flex justify-between items-start p-3 text-sm hover:bg-surface-hover transition-colors">
                              <div className="flex-1 pr-2">
                                <SecureMessageDisplay content={notification.message} className="text-gray-200 leading-snug" allowBasicFormatting={false} />
                                {notification.timestamp && (
                                  <div className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleClearOne(notification)}
                                className="text-xs text-primary hover:text-primary-hover font-bold transition-colors whitespace-nowrap"
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
                          <li key={notification.id || `cleared-${i}`} className="flex justify-between items-start p-3 text-sm hover:bg-surface-hover transition-colors">
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
              <Link href="/buyers/dashboard" className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                <User className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">Dashboard</span>
              </Link>

              <Link href="/buyers/my-orders" className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                <Package className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">My Orders</span>
              </Link>

              <Link
                href="/wallet/buyer"
                className="group flex items-center gap-1.5 whitespace-nowrap bg-surface-raised hover:bg-surface-hover text-white px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line shadow-lg text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = '/wallet/buyer';
                }}
                style={{ touchAction: 'manipulation' }}
              >
                <img src="/icons/HeaderWallet.png" alt="Wallet" className="h-5 w-5 object-contain" draggable={false} />
                <span className="font-bold text-purple-100">${Math.max(buyerBalance, 0).toFixed(2)}</span>
              </Link>

              <Link href="/buyers/messages" className="relative group">
                <div className="flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs">
                  <MessageSquare className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  <span className="sr-only xl:not-sr-only xl:inline">Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center border-2 border-white font-bold shadow-lg animate-bounce">
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
                className="bg-transparent hover:bg-surface-hover text-ink text-xs font-bold px-3 py-1.5 xl:px-4 xl:py-2 rounded-sm transition-colors duration-200 border border-line hover:border-primary-line"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                /* Solid brand fill: this is the primary action in the
                   header for a signed-out visitor, and the only filled
                   orange element up here. Black label — white on #ff950e
                   is 2.20:1 and fails AA. The inline colour is the guard
                   against the unlayered `a {}` rule in globals.css that
                   would otherwise render this orange-on-orange. */
                className="bg-primary hover:bg-primary-hover active:bg-primary-press text-xs font-bold px-3 py-1.5 xl:px-4 xl:py-2 rounded-sm transition-colors duration-200"
                style={{ color: '#000' }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 ml-1">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="flex items-center gap-1.5 bg-surface-raised px-2 py-1.5 xl:px-3 rounded-sm border border-primary-line transition-colors duration-200 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {showAvatarImage ? (
                    <SecureImage
                      src={profileAvatarSrc!}
                      alt={avatarAltText}
                      className="w-6 h-6 rounded-full object-cover border border-primary-line flex-shrink-0"
                    />
                  ) : (
                    <>
                      {isAdminUser ? (
                        <Crown className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
                      )}
                    </>
                  )}
                  <span className="text-primary font-bold text-xs">{username}</span>
                  <span className="hidden xl:inline text-ink-faint text-[10px]">({isAdminUser ? 'admin' : role})</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 bg-surface-raised px-2 py-1.5 xl:px-3 rounded-sm border border-primary-line">
                  {showAvatarImage ? (
                    <SecureImage
                      src={profileAvatarSrc!}
                      alt={avatarAltText}
                      className="w-6 h-6 rounded-full object-cover border border-primary-line flex-shrink-0"
                    />
                  ) : (
                    <>
                      {isAdminUser ? (
                        <Crown className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-primary" />
                      )}
                    </>
                  )}
                  <span className="text-primary font-bold text-xs">{username}</span>
                  <span className="hidden xl:inline text-ink-faint text-[10px]">({isAdminUser ? 'admin' : role})</span>
                </div>
              )}
              <button
                onClick={logout}
                className="group flex items-center gap-1.5 bg-surface-raised hover:bg-surface-hover text-primary px-2 py-1.5 xl:px-3 rounded-sm transition-all duration-300 border border-line hover:border-primary-line text-xs cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                <LogOut className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                <span className="sr-only xl:not-sr-only xl:inline">Log out</span>
              </button>
            </div>
          )}
        </nav>
      </div>
      </header>

      <MobileMenu />
    </>
  );
}