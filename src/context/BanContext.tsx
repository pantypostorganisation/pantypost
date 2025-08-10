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
  metadata?: Record<string, any>; // Additional context
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

// Admin usernames that cannot be banned
const PROTECTED_USERNAMES = ['admin', 'administrator', 'moderator', 'mod', 'system'];

// Specific admin accounts that cannot be banned
const ADMIN_ACCOUNTS = ['oakley', 'gerome', 'admin'];

// Helper function to check if a username is protected
const isProtectedUsername = (username: string): boolean => {
  const cleanUsername = (username || '').toLowerCase().trim();

  // Check if it's a specific admin account
  if (ADMIN_ACCOUNTS.includes(cleanUsername)) {
    return true;
  }

  // Check if username contains protected terms
  return PROTECTED_USERNAMES.some(protectedName => cleanUsername.includes(protectedName));
};

// Helper function to check if a user is an admin via the users service
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

  // Enhanced ban management
  banUser: (username: string, hours: number | 'permanent', reason: BanReason, customReason?: string, adminUsername?: string, reportIds?: string[], notes?: string, targetUserRole?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => Promise<boolean>;
  isUserBanned: (username: string) => UserBan | null;
  getBanInfo: (username: string) => UserBan | null;

  // Ban queries
  getActiveBans: () => UserBan[];
  getExpiredBans: () => UserBan[];
  getUserBanHistory: (username: string) => UserBan[];

  // Enhanced appeals
  submitAppeal: (username: string, appealText: string, evidence?: File[]) => Promise<boolean>;
  reviewAppeal: (banId: string, decision: 'approve' | 'reject' | 'escalate', reviewNotes: string, adminUsername: string) => boolean;
  approveAppeal: (banId: string, adminUsername: string) => boolean;
  rejectAppeal: (banId: string, adminUsername: string, reason?: string) => boolean;
  escalateAppeal: (banId: string, adminUsername: string, escalationReason: string) => boolean;

  // IP management
  banUserIP: (username: string, ipAddress: string, reason: string) => boolean;
  isIPBanned: (ipAddress: string) => boolean;

  // Utilities
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

  // Validation
  validateBanInput: (username: string, hours: number | 'permanent', reason: BanReason, targetUserRole?: 'buyer' | 'seller' | 'admin') => Promise<{ valid: boolean; error?: string }>;

  // Force refresh
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
  // Limit to obvious dev/demo patterns so we don't remove real users
  const patterns = [
    'spammer', 'scammer', 'troublemaker', 'oldbanner',
    'mock', 'sample', 'demo', 'test',
    'lorem', 'ipsum', 'john_doe', 'jane_doe'
  ];
  return patterns.some(p => v.includes(p));
};

const isMockBan = (b: UserBan) => {
  return (
    isMockString(b.username) ||
    isMockString(b.bannedBy) ||
    isMockString(b.customReason) ||
    isMockString(b.notes) ||
    (b.id && (b.id.startsWith('mock_') || b.id.includes('sample') || b.id.includes('test')))
  );
};

const isMockHistory = (h: BanHistory) => {
  return (
    isMockString(h.username) ||
    isMockString(h.details) ||
    isMockString(h.adminUsername) ||
    (h.id && (h.id.startsWith('mock_') || h.id.includes('sample') || h.id.includes('test')))
  );
};

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

        // Calculate new dimensions (max 800px)
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

  // Track active timers to prevent memory leaks
  const activeTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use ref to prevent re-creation
  const isSavingRef = useRef(false);

  // Force refresh function
  const refreshBanData = useCallback(async () => {
    console.log('[BanContext] Force refreshing ban data...');
    setIsInitialized(false);
    await loadData(true);
  }, []);

  // Load data from localStorage on mount using service
  const loadData = useCallback(async (forceRefresh = false) => {
    if (typeof window === 'undefined') return;
    if (isInitialized && !forceRefresh) return;

    try {
      console.log('[BanContext] Loading ban data...', { forceRefresh });

      const storedBans = await storageService.getItem<UserBan[]>('panty_user_bans', []);
      const storedHistory = await storageService.getItem<BanHistory[]>('panty_ban_history', []);
      const storedAppealReviews = await storageService.getItem<AppealReview[]>('panty_appeal_reviews', []);
      const storedIPBans = await storageService.getItem<IPBan[]>('panty_ip_bans', []);

      // Always scrub any mock/dev remnants
      const { cleanBans, cleanHistory, cleanReviews, cleanIPBans } = await scrubMocks(
        storedBans || [],
        storedHistory || [],
        storedAppealReviews || [],
        storedIPBans || []
      );

      // Update expired bans before setting
      const now = new Date();
      const updatedBans = cleanBans.map(ban => {
        if (ban.active && ban.banType === 'temporary' && ban.endTime) {
          const endTime = new Date(ban.endTime);
          if (now >= endTime) {
            console.log(`[BanContext] Auto-expiring ban for ${ban.username}`);
            return { ...ban, active: false };
          }
        }
        return ban;
      });

      setBans(updatedBans);
      setBanHistory(cleanHistory);
      setAppealReviews(cleanReviews);
      setIPBans(cleanIPBans);

      console.log('[BanContext] Data loaded:', {
        activeBans: updatedBans.filter(b => b.active).length,
        totalBans: updatedBans.length
      });

      // Save updated bans if any expired
      if (updatedBans.some((ban, idx) => ban.active !== cleanBans[idx]?.active)) {
        isSavingRef.current = true;
        await storageService.setItem('panty_user_bans', updatedBans);
        isSavingRef.current = false;
      }

      // Schedule expiration for active temporary bans
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

  // Save to localStorage using service - with protection against loops
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && !isSavingRef.current) {
      console.log('[BanContext] Saving bans to storage:', {
        activeBans: bans.filter(b => b.active).length,
        totalBans: bans.length
      });
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activeTimers.current.forEach((timer) => {
        clearTimeout(timer);
      });
      activeTimers.current.clear();
    };
  }, []);

  // Enhanced validation function - now async to check user role
  const validateBanInput = useCallback(async (username: string, hours: number | 'permanent', reason: BanReason, targetUserRole?: 'buyer' | 'seller' | 'admin'): Promise<{ valid: boolean; error?: string }> => {
    // Validate username
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return { valid: false, error: 'Invalid username format' };
    }

    // If role is provided, check it first (faster)
    if (targetUserRole === 'admin') {
      return { valid: false, error: 'Admin accounts cannot be banned' };
    }

    // Check if username is in the protected list
    if (isProtectedUsername(username)) {
      return { valid: false, error: 'This account is protected and cannot be banned' };
    }

    // If no role provided, check via user service
    if (!targetUserRole) {
      const userRole = await checkUserRole(username);
      if (userRole === 'admin') {
        return { valid: false, error: 'Admin accounts cannot be banned' };
      }
    }

    // Validate duration
    const durationValidation = banDurationSchema.safeParse(hours);
    if (!durationValidation.success) {
      return { valid: false, error: 'Invalid ban duration (max 1 year)' };
    }

    // Validate reason
    const reasonValidation = banReasonSchema.safeParse(reason);
    if (!reasonValidation.success) {
      return { valid: false, error: 'Invalid ban reason' };
    }

    return { valid: true };
  }, []);

  // Add to ban history
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

  // Schedule automatic expiration
  const scheduleExpiration = useCallback((ban: UserBan) => {
    if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;

    const timeUntilExpiry = new Date(ban.endTime).getTime() - Date.now();

    if (timeUntilExpiry > 0) {
      console.log(`[BanContext] Scheduling expiration for ${ban.username} in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);

      const timer = setTimeout(() => {
        console.log(`[BanContext] Auto-expiring ban for ${ban.username}`);
        unbanUser(ban.username, 'system', 'Automatic expiration');

        // Dispatch event for UI updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('banExpired', {
            detail: { banId: ban.id, username: ban.username }
          }));
        }

        // Clean up timer reference
        activeTimers.current.delete(ban.id);
      }, timeUntilExpiry);

      // Store timer reference
      activeTimers.current.set(ban.id, timer);
    }
  }, []);

  // Clear expiration timer
  const clearExpirationTimer = useCallback((banId: string) => {
    const timer = activeTimers.current.get(banId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.current.delete(banId);
    }
  }, []);

  // Enhanced ban user function with race condition protection
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
    console.log('[BanContext] Attempting to ban user:', { username, hours, reason, targetUserRole });

    // Validate input
    const validation = await validateBanInput(username, hours, reason, targetUserRole);
    if (!validation.valid) {
      console.error('[BanContext] Ban validation failed:', validation.error);
      if (validation.error === 'Admin accounts cannot be banned' || validation.error === 'This account is protected and cannot be banned') {
        // Show user-friendly error
        if (typeof window !== 'undefined') {
          alert(validation.error);
        }
      }
      return false;
    }

    // Sanitize inputs
    const cleanUsername = sanitizeUsername(username) || username;
    const cleanCustomReason = customReason ? sanitizeStrict(customReason) : undefined;
    const cleanAdminUsername = sanitizeUsername(adminUsername) || adminUsername;
    const cleanNotes = notes ? sanitizeStrict(notes) : undefined;

    // Validate optional fields
    if (cleanCustomReason && cleanCustomReason.length < 5) {
      console.error('[BanContext] Custom reason too short');
      return false;
    }

    // Race condition protection
    const lockKey = `ban_user_${cleanUsername}`;
    const existingLock = await storageService.getItem<any>(lockKey, null);

    if (existingLock) {
      try {
        const lockData = existingLock;
        if (Date.now() - lockData.timestamp < 30000) { // 30 second lock
          console.warn(`[BanContext] Ban operation already in progress for ${cleanUsername}`);
          return false;
        }
      } catch (e) {
        // Invalid lock data, proceed
      }
    }

    // Set lock
    await storageService.setItem(lockKey, {
      timestamp: Date.now(),
      adminUser: cleanAdminUsername
    });

    try {
      // Check if user is already banned
      const existingBan = bans.find(ban => ban.username === cleanUsername && ban.active);
      if (existingBan) {
        console.warn(`[BanContext] User ${cleanUsername} is already banned`);
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
        reportIds: reportIds,
        appealStatus: undefined
      };

      console.log('[BanContext] Creating new ban:', newBan);

      setBans(prev => {
        const updated = [...prev, newBan];
        console.log('[BanContext] Updated bans list:', {
          total: updated.length,
          active: updated.filter(b => b.active).length
        });
        return updated;
      });

      // Schedule expiration if temporary
      if (newBan.banType === 'temporary' && newBan.endTime) {
        scheduleExpiration(newBan);
      }

      // Add to history
      const durationText = hours === 'permanent' ? 'permanently' : `for ${hours} hours`;
      addBanHistory(
        'banned',
        cleanUsername,
        `Banned ${durationText} for ${reason}${cleanCustomReason ? `: ${cleanCustomReason}` : ''}`,
        cleanAdminUsername,
        { banId }
      );

      console.log('[BanContext] Ban created successfully');
      return true;
    } catch (error) {
      console.error('[BanContext] Error banning user:', error);
      return false;
    } finally {
      // Always release lock
      await storageService.removeItem(lockKey);
    }
  }, [bans, addBanHistory, scheduleExpiration, validateBanInput]);

  // Enhanced unban function - now async to ensure proper persistence
  const unbanUser = useCallback(async (username: string, adminUsername: string = 'system', reason?: string): Promise<boolean> => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const cleanAdminUsername = sanitizeUsername(adminUsername) || adminUsername;
      const cleanReason = reason ? sanitizeStrict(reason) : undefined;

      console.log('[BanContext] Unbanning user:', { username: cleanUsername, admin: cleanAdminUsername });

      // Find the ban to unban
      const banToUnban = bans.find(ban => ban.username === cleanUsername && ban.active);
      if (!banToUnban) {
        console.warn('[BanContext] No active ban found for user:', cleanUsername);
        return false;
      }

      // Clear any active timer first
      clearExpirationTimer(banToUnban.id);

      // Update the ban to set active to false
      const updatedBans = bans.map(ban => {
        if (ban.id === banToUnban.id) {
          return { ...ban, active: false };
        }
        return ban;
      });

      // Save to storage BEFORE updating state to ensure persistence
      isSavingRef.current = true;
      await storageService.setItem('panty_user_bans', updatedBans);

      // Now update state
      setBans(updatedBans);

      // Add to history
      addBanHistory('unbanned', cleanUsername, cleanReason || 'Ban lifted by admin', cleanAdminUsername);

      // Save history
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

      console.log('[BanContext] User unbanned successfully');

      // Dispatch event for UI updates
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

  // Enhanced appeal submission with evidence
  const submitAppeal = useCallback(async (username: string, appealText: string, evidence?: File[]): Promise<boolean> => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const appealValidation = appealTextSchema.safeParse(appealText);

      if (!appealValidation.success) {
        console.error('[BanContext] Invalid appeal text:', appealValidation.error);
        return false;
      }

      const cleanAppealText = sanitizeStrict(appealValidation.data);

      let appealEvidence: string[] = [];

      // Process evidence files
      if (evidence && evidence.length > 0) {
        try {
          appealEvidence = await Promise.all(
            evidence.slice(0, 3).map(file => compressImage(file)) // Max 3 files
          );
        } catch (error) {
          console.error('Error processing appeal evidence:', error);
          // Continue without evidence if processing fails
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

  // Enhanced appeal review system
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

  // Approve appeal
  const approveAppeal = useCallback((banId: string, adminUsername: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b =>
        b.id === banId ? { ...b, active: false, appealStatus: 'approved' as AppealStatus } : b
      ));

      // Clear any active timer
      clearExpirationTimer(banId);

      addBanHistory('appeal_approved', ban.username, 'Appeal approved and ban lifted', adminUsername);
      return true;
    } catch (error) {
      console.error('Error approving appeal:', error);
      return false;
    }
  }, [bans, addBanHistory, clearExpirationTimer]);

  // Reject appeal
  const rejectAppeal = useCallback((banId: string, adminUsername: string, reason?: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b =>
        b.id === banId
          ? {
              ...b,
              appealSubmitted: false,
              appealText: undefined,
              appealable: false,
              appealStatus: 'rejected' as AppealStatus
            }
          : b
      ));

      addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
      return true;
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      return false;
    }
  }, [bans, addBanHistory]);

  // Escalate appeal
  const escalateAppeal = useCallback((banId: string, adminUsername: string, escalationReason: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;

      setBans(prev => prev.map(b =>
        b.id === banId
          ? { ...b, appealStatus: 'escalated' as AppealStatus }
          : b
      ));

      addBanHistory('appeal_escalated', ban.username, `Appeal escalated: ${escalationReason}`, adminUsername);
      return true;
    } catch (error) {
      console.error('Error escalating appeal:', error);
      return false;
    }
  }, [bans, addBanHistory]);

  // IP ban functionality
  const banUserIP = useCallback((username: string, ipAddress: string, reason: string): boolean => {
    try {
      const cleanUsername = sanitizeUsername(username) || username;
      const ipValidation = ipAddressSchema.safeParse(ipAddress);

      if (!ipValidation.success) {
        console.error('[BanContext] Invalid IP address format');
        return false;
      }

      const cleanReason = sanitizeStrict(reason);

      const ipBan: IPBan = {
        ipAddress: ipValidation.data,
        bannedUsernames: [cleanUsername],
        banDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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

  // Check if IP is banned
  const isIPBanned = useCallback((ipAddress: string): boolean => {
    const now = new Date();
    return ipBans.some(ban =>
      ban.ipAddress === ipAddress &&
      (!ban.expiryDate || new Date(ban.expiryDate) > now)
    );
  }, [ipBans]);

  // Check if user is banned (with real-time expiration check)
  const isUserBanned = useCallback((username: string): UserBan | null => {
    const activeBan = bans.find(ban => ban.username === username && ban.active);

    if (!activeBan) return null;

    // Check if temporary ban has expired
    if (activeBan.banType === 'temporary' && activeBan.endTime) {
      const now = new Date();
      const endTime = new Date(activeBan.endTime);

      if (now >= endTime) {
        // Ban has expired, automatically unban
        unbanUser(username, 'system', 'Temporary ban expired');
        return null;
      }

      // Update remaining hours
      const remainingMs = endTime.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      activeBan.remainingHours = Math.max(0, remainingHours);
    }

    return activeBan;
  }, [bans, unbanUser]);

  // Get ban info (same as isUserBanned but clearer name)
  const getBanInfo = useCallback((username: string): UserBan | null => {
    return isUserBanned(username);
  }, [isUserBanned]);

  // Get active bans
  const getActiveBans = useCallback((): UserBan[] => {
    const activeBans = bans.filter(ban => ban.active).map(ban => {
      // Update remaining hours for temporary bans
      if (ban.banType === 'temporary' && ban.endTime) {
        const now = new Date();
        const endTime = new Date(ban.endTime);
        const remainingMs = endTime.getTime() - now.getTime();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        ban.remainingHours = Math.max(0, remainingHours);
      }
      return ban;
    });

    console.log('[BanContext] Getting active bans:', {
      total: bans.length,
      active: activeBans.length,
      usernames: activeBans.map(b => b.username)
    });

    return activeBans;
  }, [bans]);

  // Get expired bans
  const getExpiredBans = useCallback((): UserBan[] => {
    return bans.filter(ban => !ban.active);
  }, [bans]);

  // Get user's ban history
  const getUserBanHistory = useCallback((username: string): UserBan[] => {
    return bans.filter(ban => ban.username === username);
  }, [bans]);

  // Update expired bans
  const updateExpiredBans = useCallback(() => {
    const now = new Date();
    let hasChanges = false;

    setBans(prev => prev.map(ban => {
      if (ban.active && ban.banType === 'temporary' && ban.endTime) {
        const endTime = new Date(ban.endTime);
        if (now >= endTime) {
          clearExpirationTimer(ban.id);
          hasChanges = true;
          addBanHistory('unbanned', ban.username, 'Temporary ban expired automatically', 'system');
          return { ...ban, active: false };
        }
      }
      return ban;
    }));

    if (hasChanges) {
      console.log('[BanContext] Expired bans updated');
    }
  }, [addBanHistory, clearExpirationTimer]);

  // Get comprehensive ban statistics
  const getBanStats = useCallback(() => {
    const activeBans = getActiveBans();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count bans by reason
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

    // Appeal statistics
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

    console.log('[BanContext] Ban stats:', stats);

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
