// src/context/BanContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { storageService } from '@/services';
import { usersService } from '@/services/users.service';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';

export type BanType = 'temporary' | 'permanent';
export type BanReason = 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'underage' | 'payment_fraud' | 'other';
export type AppealStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated';

export type UserBan = {
  id: string;
  username: string;
  banType: BanType;
  reason: BanReason;
  customReason?: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string, undefined for permanent bans
  remainingHours?: number; // calculated field
  bannedBy: string; // admin username
  active: boolean;
  appealable: boolean;
  appealSubmitted?: boolean;
  appealText?: string;
  appealDate?: string;
  appealStatus?: AppealStatus;
  appealEvidence?: string[]; // Base64 encoded images
  notes?: string; // admin notes
  reportIds?: string[]; // linked report IDs that led to this ban
  ipAddress?: string; // For future IP tracking
  expirationTimer?: NodeJS.Timeout; // Timer reference for auto-expiration
};

export type BanHistory = {
  id: string;
  username: string;
  action: 'banned' | 'unbanned' | 'appeal_submitted' | 'appeal_approved' | 'appeal_rejected' | 'appeal_escalated';
  details: string;
  timestamp: string;
  adminUsername: string;
  metadata?: Record<string, any>;
};

export type AppealReview = {
  reviewId: string;
  banId: string;
  reviewerAdmin: string;
  reviewNotes: string;
  decision: 'approve' | 'reject' | 'escalate';
  reviewDate: string;
  escalationReason?: string;
};

export type IPBan = {
  ipAddress: string;
  bannedUsernames: string[];
  banDate: string;
  expiryDate?: string;
  reason: string;
};

// Protected/system-like usernames (not personal accounts)
const PROTECTED_USERNAMES = ['admin', 'administrator', 'moderator', 'mod', 'system'];

// Helper: username "looks like" a protected/system name
const isProtectedUsername = (username: string): boolean => {
  const cleanUsername = (username || '').toLowerCase().trim();
  return PROTECTED_USERNAMES.some(protectedName => cleanUsername.includes(protectedName));
};

// Check user role from service
const checkUserRole = async (username: string): Promise<'buyer' | 'seller' | 'admin' | null> => {
  try {
    const result = await usersService.getUser(username);
    if (result.success && result.data && result.data.role) {
      return result.data.role;
    }
    return null;
  } catch (error) {
    console.error('[BanContext] Error checking user role:', error);
    return null;
  }
};

type BanContextType = {
  bans: UserBan[];
  banHistory: BanHistory[];
  appealReviews: AppealReview[];
  ipBans: IPBan[];

  banUser: (username: string, hours: number | 'permanent', reason: BanReason, customReason?: string, adminUsername?: string, reportIds?: string[], notes?: string, targetUserRole?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => Promise<boolean>;
  isUserBanned: (username: string) => UserBan | null;
  getBanInfo: (username: string) => UserBan | null;

  getActiveBans: () => UserBan[];
  getExpiredBans: () => UserBan[];
  getUserBanHistory: (username: string) => UserBan[];

  submitAppeal: (username: string, appealText: string, evidence?: File[]) => Promise<boolean>;
  reviewAppeal: (banId: string, decision: 'approve' | 'reject' | 'escalate', reviewNotes: string, adminUsername: string) => boolean;
  approveAppeal: (banId: string, adminUsername: string) => boolean;
  rejectAppeal: (banId: string, adminUsername: string, reason?: string) => boolean;
  escalateAppeal: (banId: string, adminUsername: string, escalationReason: string) => boolean;

  banUserIP: (username: string, ipAddress: string, reason: string) => boolean;
  isIPBanned: (ipAddress: string) => boolean;

  updateExpiredBans: () => void;
  scheduleExpiration: (ban: UserBan) => void;
  clearExpirationTimer: (banId: string) => void;
  getBanStats: () => {
    totalActiveBans: number;
    temporaryBans: number;
    permanentBans: number;
    pendingAppeals: number;
    recentBans24h: number;
    bansByReason: Record<BanReason, number>;
    appealStats: {
      totalAppeals: number;
      pendingAppeals: number;
      approvedAppeals: number;
      rejectedAppeals: number;
    };
  };

  validateBanInput: (username: string, hours: number | 'permanent', reason: BanReason, targetUserRole?: 'buyer' | 'seller' | 'admin') => Promise<{ valid: boolean; error?: string }>;
  refreshBanData: () => Promise<void>;
};

const BanContext = createContext<BanContextType | undefined>(undefined);

// Validation schemas
const banReasonSchema = z.enum(['harassment', 'spam', 'inappropriate_content', 'scam', 'underage', 'payment_fraud', 'other']);
const banDurationSchema = z.union([z.literal('permanent'), z.number().positive().max(8760)]);
const appealTextSchema = z.string().min(10).max(1000);
const customReasonSchema = z.string().min(5).max(500);
const banNotesSchema = z.string().max(1000);
const ipAddressSchema = z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/);

// ---- Conservative mock data detector/scrubber ----
const isMockString = (val?: string) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  const patterns = [
    'spammer', 'scammer', 'troublemaker', 'oldbanner',
    'mock', 'sample', 'demo', 'test',
    'lorem', 'ipsum', 'john_doe', 'jane_doe'
  ];
  return patterns.some(p => v.includes(p));
};

const isMockBan = (b: UserBan) =>
  isMockString(b.username) ||
  isMockString(b.bannedBy) ||
  isMockString(b.customReason) ||
  isMockString(b.notes) ||
  (b.id && (b.id.startsWith('mock_') || b.id.includes('sample') || b.id.includes('test')));

const isMockHistory = (h: BanHistory) =>
  isMockString(h.username) ||
  isMockString(h.details) ||
  isMockString(h.adminUsername) ||
  (h.id && (h.id.startsWith('mock_') || h.id.includes('sample') || h.id.includes('test')));

const scrubMocks = async (bans: UserBan[], history: BanHistory[], reviews: AppealReview[], ipBans: IPBan[]) => {
  const cleanBans = bans.filter(b => !isMockBan(b));
  const cleanHistory = history.filter(h => !isMockHistory(h));
  const cleanReviews = reviews.filter(r => !(r.reviewId?.startsWith?.('mock_') || isMockString(r.reviewerAdmin) || isMockString(r.reviewNotes)));
  const cleanIPBans = ipBans.filter(ip => !(ip.ipAddress?.startsWith?.('0.0.0') || isMockString(ip.reason)));

  const removed = {
    bans: bans.length - cleanBans.length,
    history: history.length - cleanHistory.length,
    reviews: reviews.length - cleanReviews.length,
    ipBans: ipBans.length - cleanIPBans.length
  };

  if (removed.bans || removed.history || removed.reviews || removed.ipBans) {
    console.warn('[BanContext] Removed mock/dev data from storage:', removed);
    await storageService.setItem('panty_user_bans', cleanBans);
    await storageService.setItem('panty_ban_history', cleanHistory);
    await storageService.setItem('panty_appeal_reviews', cleanReviews);
    await storageService.setItem('panty_ip_bans', cleanIPBans);
  }

  return { cleanBans, cleanHistory, cleanReviews, cleanIPBans };
};
// --------------------------------------------------

// Compress images for appeal evidence
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxDimension = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const BanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [banHistory, setBanHistory] = useState<BanHistory[]>([]);
  const [appealReviews, setAppealReviews] = useState<AppealReview[]>([]);
  const [ipBans, setIPBans] = useState<IPBan[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const activeTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isSavingRef = useRef(false);

  const refreshBanData = useCallback(async () => {
    setIsInitialized(false);
    await loadData(true);
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (typeof window === 'undefined') return;
    if (isInitialized && !forceRefresh) return;

    try {
      const storedBans = await storageService.getItem<UserBan[]>('panty_user_bans', []);
      const storedHistory = await storageService.getItem<BanHistory[]>('panty_ban_history', []);
      const storedAppealReviews = await storageService.getItem<AppealReview[]>('panty_appeal_reviews', []);
      const storedIPBans = await storageService.getItem<IPBan[]>('panty_ip_bans', []);

      const { cleanBans, cleanHistory, cleanReviews, cleanIPBans } = await scrubMocks(
        storedBans || [],
        storedHistory || [],
        storedAppealReviews || [],
        storedIPBans || []
      );

      const now = new Date();
      const updatedBans = cleanBans.map(ban => {
        if (ban.active && ban.banType === 'temporary' && ban.endTime) {
          const endTime = new Date(ban.endTime);
          if (now >= endTime) {
            return { ...ban, active: false };
          }
        }
        return ban;
      });

      setBans(updatedBans);
      setBanHistory(cleanHistory);
      setAppealReviews(cleanReviews);
      setIPBans(cleanIPBans);

      if (updatedBans.some((ban, idx) => ban.active !== cleanBans[idx]?.active)) {
        isSavingRef.current = true;
        await storageService.setItem('panty_user_bans', updatedBans);
        isSavingRef.current = false;
      }

      updatedBans.forEach((ban: UserBan) => {
        if (ban.active && ban.banType === 'temporary' && ban.endTime) {
          scheduleExpiration(ban);
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('[BanContext] Error loading ban data:', error);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSavingRef.current) {
      isSavingRef.current = true;
      storageService.setItem('panty_user_bans', bans).then(() => {
        isSavingRef.current = false;
      });
    }
  }, [bans, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSavingRef.current) {
      storageService.setItem('panty_ban_history', banHistory);
    }
  }, [banHistory, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSavingRef.current) {
      storageService.setItem('panty_appeal_reviews', appealReviews);
    }
  }, [appealReviews, isInitialized]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSavingRef.current) {
      storageService.setItem('panty_ip_bans', ipBans);
    }
  }, [ipBans, isInitialized]);

  useEffect(() => {
    return () => {
      activeTimers.current.forEach((timer) => clearTimeout(timer));
      activeTimers.current.clear();
    };
  }, []);

  // Validation (dynamic: checks role via service)
  const validateBanInput = useCallback(async (username: string, hours: number | 'permanent', reason: BanReason, targetUserRole?: 'buyer' | 'seller' | 'admin'): Promise<{ valid: boolean; error?: string }> => {
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return { valid: false, error: 'Invalid username format' };
    }

    // Don't allow banning admins by role
    if (targetUserRole === 'admin') {
      return { valid: false, error: 'Admin accounts cannot be banned' };
    }

    // Protected usernames (system-like)
    if (isProtectedUsername(username)) {
      return { valid: false, error: 'This account is protected and cannot be banned' };
    }

    // If no role provided, look it up
    if (!targetUserRole) {
      const userRole = await checkUserRole(username);
      if (userRole === 'admin') {
        return { valid: false, error: 'Admin accounts cannot be banned' };
      }
    }

    const durationValidation = banDurationSchema.safeParse(hours);
    if (!durationValidation.success) {
      return { valid: false, error: 'Invalid ban duration (max 1 year)' };
    }

    const reasonValidation = banReasonSchema.safeParse(reason);
    if (!reasonValidation.success) {
      return { valid: false, error: 'Invalid ban reason' };
    }

    return { valid: true };
  }, []);

  const addBanHistory = useCallback((action: BanHistory['action'], username: string, details: string, adminUsername: string, metadata?: Record<string, any>) => {
    const historyEntry: BanHistory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username: sanitizeUsername(username) || username,
      action,
      details: sanitizeStrict(details),
      timestamp: new Date().toISOString(),
      adminUsername: sanitizeUsername(adminUsername) || adminUsername,
      metadata
    };
    setBanHistory(prev => [...prev, historyEntry]);
  }, []);

  const scheduleExpiration = useCallback((ban: UserBan) => {
    if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;

    const timeUntilExpiry = new Date(ban.endTime).getTime() - Date.now();
    if (timeUntilExpiry > 0) {
      const timer = setTimeout(() => {
        unbanUser(ban.username, 'system', 'Automatic expiration');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('banExpired', {
            detail: { banId: ban.id, username: ban.username }
          }));
        }
        activeTimers.current.delete(ban.id);
      }, timeUntilExpiry);
      activeTimers.current.set(ban.id, timer);
    }
  }, []);

  const clearExpirationTimer = useCallback((banId: string) => {
    const timer = activeTimers.current.get(banId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.current.delete(banId);
    }
  }, []);

  const banUser = useCallback(async (
    username: string,
    hours: number | 'permanent',
    reason: BanReason,
    customReason?: string,
    adminUsername: string = 'system',
    reportIds: string[] = [],
    notes?: string,
    targetUserRole?: 'buyer' | 'seller' | 'admin'
  ): Promise<boolean> => {
    const validation = await validateBanInput(username, hours, reason, targetUserRole);
    if (!validation.valid) {
      if (typeof window !== 'undefined' && validation.error) alert(validation.error);
      return false;
    }

    const cleanUsername = sanitizeUsername(username) || username;
    const cleanCustomReason = customReason ? sanitizeStrict(customReason) : undefined;
    const cleanAdminUsername = sanitizeUsername(adminUsername) || adminUsername;
    const cleanNotes = notes ? sanitizeStrict(notes) : undefined;

    const lockKey = `ban_user_${cleanUsername}`;
    const existingLock = await storageService.getItem<any>(lockKey, null);
    if (existingLock) {
      try {
        const lockData = existingLock;
        if (Date.now() - lockData.timestamp < 30000) {
          return false;
        }
      } catch {
        // ignore invalid lock
      }
    }
    await storageService.setItem(lockKey, { timestamp: Date.now(), adminUser: cleanAdminUsername });

    try {
      const existingBan = bans.find(ban => ban.username === cleanUsername && ban.active);
      if (existingBan) {
        return false;
      }

      const now = new Date();
      const banId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      const newBan: UserBan = {
        id: banId,
        username: cleanUsername,
        banType: hours === 'permanent' ? 'permanent' : 'temporary',
        reason,
        customReason: cleanCustomReason,
        startTime: now.toISOString(),
        endTime: hours === 'permanent' ? undefined : new Date(now.getTime() + (hours as number) * 60 * 60 * 1000).toISOString(),
        remainingHours: hours === 'permanent' ? undefined : (hours as number),
        bannedBy: cleanAdminUsername,
        active: true,
        appealable: true,
        notes: cleanNotes,
        reportIds,
        appealStatus: undefined
      };

      setBans(prev => [...prev, newBan]);

      if (newBan.banType === 'temporary' && newBan.endTime) {
        scheduleExpiration(newBan);
      }

      const durationText = hours === 'permanent' ? 'permanently' : `for ${hours} hours`;
      addBanHistory(
        'banned',
        cleanUsername,
        `Banned ${durationText} for ${reason}${cleanCustomReason ? `: ${cleanCustomReason}` : ''}`,
        cleanAdminUsername,
        { banId }
      );

      return true;
    } catch (error) {
      console.error('[BanContext] Error banning user:', error);
      return false;
    } finally {
      await storageService.removeItem(lockKey);
    }
  }, [bans, addBanHistory, scheduleExpiration, validateBanInput]);

  const unbanUser = useCallback(async (username: string, adminUsername: string = 'system', reason?: string): Promise<boolean> => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const cleanAdminUsername = sanitizeUsername(adminUsername) || adminUsername;
      const cleanReason = reason ? sanitizeStrict(reason) : undefined;

      const banToUnban = bans.find(ban => ban.username === cleanUsername && ban.active);
      if (!banToUnban) return false;

      clearExpirationTimer(banToUnban.id);

      const updatedBans = bans.map(ban => ban.id === banToUnban.id ? { ...ban, active: false } : ban);

      isSavingRef.current = true;
      await storageService.setItem('panty_user_bans', updatedBans);
      setBans(updatedBans);

      addBanHistory('unbanned', cleanUsername, cleanReason || 'Ban lifted by admin', cleanAdminUsername);

      const updatedHistory = [...banHistory, {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        username: cleanUsername,
        action: 'unbanned' as const,
        details: cleanReason || 'Ban lifted by admin',
        timestamp: new Date().toISOString(),
        adminUsername: cleanAdminUsername,
        metadata: {}
      }];
      await storageService.setItem('panty_ban_history', updatedHistory);

      isSavingRef.current = false;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('banUpdated', {
          detail: { banId: banToUnban.id, username: cleanUsername, action: 'unbanned' }
        }));
      }

      return true;
    } catch (error) {
      console.error('[BanContext] Error unbanning user:', error);
      isSavingRef.current = false;
      return false;
    }
  }, [bans, banHistory, addBanHistory, clearExpirationTimer]);

  const submitAppeal = useCallback(async (username: string, appealText: string, evidence?: File[]): Promise<boolean> => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const appealValidation = appealTextSchema.safeParse(appealText);
      if (!appealValidation.success) return false;

      const cleanAppealText = sanitizeStrict(appealValidation.data);
      let appealEvidence: string[] = [];

      if (evidence && evidence.length > 0) {
        try {
          appealEvidence = await Promise.all(
            evidence.slice(0, 3).map(file => compressImage(file))
          );
        } catch (error) {
          console.error('Error processing appeal evidence:', error);
        }
      }

      setBans(prev => prev.map(ban =>
        ban.username === cleanUsername && ban.active && ban.appealable
          ? {
              ...ban,
              appealSubmitted: true,
              appealText: cleanAppealText,
              appealDate: new Date().toISOString(),
              appealStatus: 'pending' as AppealStatus,
              appealEvidence
            }
          : ban
      ));

      addBanHistory(
        'appeal_submitted',
        cleanUsername,
        `Appeal submitted: "${cleanAppealText.substring(0, 100)}${cleanAppealText.length > 100 ? '...' : ''}"`,
        cleanUsername,
        { evidenceCount: appealEvidence.length }
      );

      return true;
    } catch (error) {
      console.error('Error submitting appeal:', error);
      return false;
    }
  }, [addBanHistory]);

  const reviewAppeal = useCallback((banId: string, decision: 'approve' | 'reject' | 'escalate', reviewNotes: string, adminUsername: string): boolean => {
    try {
      const cleanReviewNotes = sanitizeStrict(reviewNotes);
      const cleanAdminUsername = sanitizeUsername(adminUsername) || adminUsername;

      const review: AppealReview = {
        reviewId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        banId,
        reviewerAdmin: cleanAdminUsername,
        reviewNotes: cleanReviewNotes,
        decision,
        reviewDate: new Date().toISOString(),
        escalationReason: decision === 'escalate' ? cleanReviewNotes : undefined
      };

      setAppealReviews(prev => [...prev, review]);

      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      if (decision === 'approve') {
        return approveAppeal(banId, cleanAdminUsername);
      } else if (decision === 'reject') {
        return rejectAppeal(banId, cleanAdminUsername, cleanReviewNotes);
      } else if (decision === 'escalate') {
        return escalateAppeal(banId, cleanAdminUsername, cleanReviewNotes);
      }
      return true;
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      return false;
    }
  }, [bans]);

  const approveAppeal = useCallback((banId: string, adminUsername: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b => b.id === banId ? { ...b, active: false, appealStatus: 'approved' as AppealStatus } : b));
      clearExpirationTimer(banId);
      addBanHistory('appeal_approved', ban.username, 'Appeal approved and ban lifted', adminUsername);
      return true;
    } catch (error) {
      console.error('Error approving appeal:', error);
      return false;
    }
  }, [bans, addBanHistory, clearExpirationTimer]);

  const rejectAppeal = useCallback((banId: string, adminUsername: string, reason?: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b =>
        b.id === banId
          ? { ...b, appealSubmitted: false, appealText: undefined, appealable: false, appealStatus: 'rejected' as AppealStatus }
          : b
      ));
      addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
      return true;
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      return false;
    }
  }, [bans, addBanHistory]);

  const escalateAppeal = useCallback((banId: string, adminUsername: string, escalationReason: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b => b.id === banId ? { ...b, appealStatus: 'escalated' as AppealStatus } : b));
      addBanHistory('appeal_escalated', ban.username, `Appeal escalated: ${escalationReason}`, adminUsername);
      return true;
    } catch (error) {
      console.error('Error escalating appeal:', error);
      return false;
    }
  }, [bans, addBanHistory]);

  const banUserIP = useCallback((username: string, ipAddress: string, reason: string): boolean => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const ipValidation = ipAddressSchema.safeParse(ipAddress);
      if (!ipValidation.success) return false;

      const cleanReason = sanitizeStrict(reason);
      const ipBan: IPBan = {
        ipAddress: ipValidation.data,
        bannedUsernames: [cleanUsername],
        banDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        reason: cleanReason
      };

      setIPBans(prev => {
        const existing = prev.find(ban => ban.ipAddress === ipValidation.data);
        if (existing) {
          return prev.map(ban =>
            ban.ipAddress === ipValidation.data
              ? { ...ban, bannedUsernames: [...new Set([...ban.bannedUsernames, cleanUsername])] }
              : ban
          );
        }
        return [...prev, ipBan];
      });

      return true;
    } catch (error) {
      console.error('Error banning IP:', error);
      return false;
    }
  }, []);

  const isIPBanned = useCallback((ipAddress: string): boolean => {
    const now = new Date();
    return ipBans.some(ban =>
      ban.ipAddress === ipAddress &&
      (!ban.expiryDate || new Date(ban.expiryDate) > now)
    );
  }, [ipBans]);

  const isUserBanned = useCallback((username: string): UserBan | null => {
    const activeBan = bans.find(ban => ban.username === username && ban.active);
    if (!activeBan) return null;

    if (activeBan.banType === 'temporary' && activeBan.endTime) {
      const now = new Date();
      const endTime = new Date(activeBan.endTime);
      if (now >= endTime) {
        unbanUser(username, 'system', 'Temporary ban expired');
        return null;
      }
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      activeBan.remainingHours = Math.max(0, remainingHours);
    }
    return activeBan;
  }, [bans, unbanUser]);

  const getBanInfo = useCallback((username: string): UserBan | null => {
    return isUserBanned(username);
  }, [isUserBanned]);

  const getActiveBans = useCallback((): UserBan[] => {
    const activeBans = bans.filter(ban => ban.active).map(ban => {
      if (ban.banType === 'temporary' && ban.endTime) {
        const now = new Date();
        const endTime = new Date(ban.endTime);
        const remainingMs = endTime.getTime() - now.getTime();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        ban.remainingHours = Math.max(0, remainingHours);
      }
      return ban;
    });
    return activeBans;
  }, [bans]);

  const getExpiredBans = useCallback((): UserBan[] => {
    return bans.filter(ban => !ban.active);
  }, [bans]);

  const getUserBanHistory = useCallback((username: string): UserBan[] => {
    return bans.filter(ban => ban.username === username);
  }, [bans]);

  const updateExpiredBans = useCallback(() => {
    const now = new Date();
    setBans(prev => prev.map(ban => {
      if (ban.active && ban.banType === 'temporary' && ban.endTime) {
        const endTime = new Date(ban.endTime);
        if (now >= endTime) {
          clearExpirationTimer(ban.id);
          addBanHistory('unbanned', ban.username, 'Temporary ban expired automatically', 'system');
          return { ...ban, active: false };
        }
      }
      return ban;
    }));
  }, [addBanHistory, clearExpirationTimer]);

  const getBanStats = useCallback(() => {
    const activeBans = getActiveBans();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bansByReason: Record<BanReason, number> = {
      harassment: 0,
      spam: 0,
      inappropriate_content: 0,
      scam: 0,
      underage: 0,
      payment_fraud: 0,
      other: 0
    };

    activeBans.forEach(ban => {
      bansByReason[ban.reason]++;
    });

    const allAppeals = bans.filter(ban => ban.appealSubmitted);
    const appealStats = {
      totalAppeals: allAppeals.length,
      pendingAppeals: allAppeals.filter(ban => ban.appealStatus === 'pending').length,
      approvedAppeals: banHistory.filter(entry => entry.action === 'appeal_approved').length,
      rejectedAppeals: banHistory.filter(entry => entry.action === 'appeal_rejected').length
    };

    const stats = {
      totalActiveBans: activeBans.length,
      temporaryBans: activeBans.filter(ban => ban.banType === 'temporary').length,
      permanentBans: activeBans.filter(ban => ban.banType === 'permanent').length,
      pendingAppeals: activeBans.filter(ban => ban.appealSubmitted && ban.appealStatus === 'pending').length,
      recentBans24h: bans.filter(ban => new Date(ban.startTime) >= twentyFourHoursAgo).length,
      bansByReason,
      appealStats
    };

    return stats;
  }, [getActiveBans, bans, banHistory]);

  return (
    <BanContext.Provider value={{
      bans,
      banHistory,
      appealReviews,
      ipBans,
      banUser,
      unbanUser,
      isUserBanned,
      getBanInfo,
      getActiveBans,
      getExpiredBans,
      getUserBanHistory,
      submitAppeal,
      reviewAppeal,
      approveAppeal,
      rejectAppeal,
      escalateAppeal,
      banUserIP,
      isIPBanned,
      updateExpiredBans,
      scheduleExpiration,
      clearExpirationTimer,
      getBanStats,
      validateBanInput,
      refreshBanData
    }}>
      {children}
    </BanContext.Provider>
  );
};

export const useBans = () => {
  const context = useContext(BanContext);
  if (!context) {
    throw new Error('useBans must be used within a BanProvider');
  }
  return context;
};
