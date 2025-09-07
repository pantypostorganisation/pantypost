// src/context/BanContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { banService } from '@/services/ban.service';
import { usersService } from '@/services/users.service';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';
import { useAuth } from './AuthContext';
import { isAdmin } from '@/utils/security/permissions';
import { FEATURES } from '@/services/api.config';

// ================== Types ==================
export type BanType = 'temporary' | 'permanent';
export type BanReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate_content'
  | 'scam'
  | 'underage'
  | 'payment_fraud'
  | 'other';
export type AppealStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated';

export type UserBan = {
  id: string;
  username: string;
  banType: BanType;
  reason: BanReason;
  customReason?: string;
  startTime: string; // ISO
  endTime?: string; // ISO for temporary
  remainingHours?: number; // derived
  bannedBy: string; // admin username
  active: boolean;
  appealable: boolean;
  appealSubmitted?: boolean;
  appealText?: string;
  appealDate?: string;
  appealStatus?: AppealStatus;
  appealEvidence?: string[]; // base64 images
  notes?: string;
  reportIds?: string[];
  ipAddress?: string;
  expirationTimer?: ReturnType<typeof setTimeout>;
};

export type BanHistory = {
  id: string;
  username: string;
  action:
    | 'banned'
    | 'unbanned'
    | 'appeal_submitted'
    | 'appeal_approved'
    | 'appeal_rejected'
    | 'appeal_escalated';
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

// ================== Constants ==================

/**
 * Reserved usernames that should never be bannable (system/service accounts).
 * NOTE: Not human admins; real admin checks use role via isAdmin(user).
 */
const RESERVED_USERNAMES = ['system', 'platform', 'admin', 'administrator', 'moderator', 'mod'] as const;

/** Exact-match, case-insensitive protection for reserved accounts */
const isProtectedUsername = (username: string): boolean => {
  const clean = (username || '').toLowerCase().trim();
  return RESERVED_USERNAMES.includes(clean as (typeof RESERVED_USERNAMES)[number]);
};

// Ask backend for role (defensive, in case caller doesn't pass role)
const checkUserRole = async (
  username: string
): Promise<'buyer' | 'seller' | 'admin' | null> => {
  try {
    const result = await usersService.getUser(username);
    if (result.success && result.data?.role) return result.data.role;
    return null;
  } catch (err) {
    console.error('[BanContext] Error checking user role:', err);
    return null;
  }
};

type BanContextType = {
  bans: UserBan[];
  banHistory: BanHistory[];
  appealReviews: AppealReview[];
  ipBans: IPBan[];

  // Enhanced ban management
  banUser: (
    username: string,
    hours: number | 'permanent',
    reason: BanReason,
    customReason?: string,
    adminUsername?: string,
    reportIds?: string[],
    notes?: string,
    targetUserRole?: 'buyer' | 'seller' | 'admin'
  ) => Promise<boolean>;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => Promise<boolean>;
  isUserBanned: (username: string) => UserBan | null;
  getBanInfo: (username: string) => UserBan | null;

  // Ban queries
  getActiveBans: () => UserBan[];
  getExpiredBans: () => UserBan[];
  getUserBanHistory: (username: string) => UserBan[];

  // Appeals
  submitAppeal: (username: string, appealText: string, evidence?: File[]) => Promise<boolean>;
  reviewAppeal: (
    banId: string,
    decision: 'approve' | 'reject' | 'escalate',
    reviewNotes: string,
    adminUsername: string
  ) => boolean;
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
  validateBanInput: (
    username: string,
    hours: number | 'permanent',
    reason: BanReason,
    targetUserRole?: 'buyer' | 'seller' | 'admin'
  ) => Promise<{ valid: boolean; error?: string }>;

  // Force refresh
  refreshBanData: () => Promise<void>;
  isLoading: boolean;
};

const BanContext = createContext<BanContextType | undefined>(undefined);

// ================== Validation Schemas ==================
const banReasonSchema = z.enum([
  'harassment',
  'spam',
  'inappropriate_content',
  'scam',
  'underage',
  'payment_fraud',
  'other',
]);

const banDurationSchema = z.union([z.literal('permanent'), z.number().positive().max(8760)]);
const appealTextSchema = z.string().min(10).max(1000);
const customReasonSchema = z.string().min(5).max(500);

// Simple IPv4, conservative; adjust if you need IPv6
const ipAddressSchema = z.string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/);

// Image compression for appeal evidence (defensive checks)
const compressImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Invalid file type'));
      }
      // Limit ~5MB files to avoid memory issues
      if (typeof file.size === 'number' && file.size > 5 * 1024 * 1024) {
        console.warn('[BanContext] Evidence file is large; compressing aggressively');
      }

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
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    } catch (e) {
      reject(e);
    }
  });

// ================== Provider ==================
export const BanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [banHistory, setBanHistory] = useState<BanHistory[]>([]);
  const [appealReviews, setAppealReviews] = useState<AppealReview[]>([]);
  const [ipBans, setIPBans] = useState<IPBan[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  // Track active timers to prevent leaks
  const activeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Dev override to allow non-admin actions locally when explicitly enabled
  const canAdminAct = useCallback(
    (action: string): boolean => {
      const devBypass = process.env.NEXT_PUBLIC_ALLOW_LOCAL_BAN === '1';
      if (devBypass && user) {
        console.warn(`[BanContext] Dev override enabled for action: ${action} by ${user.username}`);
        return true;
      }
      return !!(user && isAdmin(user));
    },
    [user]
  );

  // Force refresh function - fetch from backend
  const refreshBanData = useCallback(async () => {
    // Only fetch bans if API is enabled and user is admin
    if (!FEATURES.USE_API_BANS) {
      console.log('[BanContext] API bans disabled');
      setIsInitialized(true);
      return;
    }

    // Only admins can fetch all bans
    if (!user || !isAdmin(user)) {
      console.log('[BanContext] Skipping ban fetch - user is not admin');
      
      // Non-admin users should check their own ban status
      if (user) {
        try {
          const response = await banService.checkUserBan(user.username);
          if (response.success && response.data) {
            const ban = response.data;
            const mappedBan: UserBan = {
              id: ban._id || ban.id || `ban_${Date.now()}`,
              username: ban.username,
              banType: ban.isPermanent || ban.duration === 'permanent' ? 'permanent' : 'temporary',
              reason: ban.reason || 'other',
              customReason: ban.customReason,
              startTime: ban.createdAt || ban.startTime || new Date().toISOString(),
              endTime: ban.expiresAt || ban.endTime,
              bannedBy: ban.bannedBy || 'admin',
              active: true,
              appealable: ban.appealable !== false,
              notes: ban.notes,
            };
            setBans([mappedBan]);
          }
        } catch (error) {
          console.log('[BanContext] User is not banned or error checking ban status');
        }
      }
      
      setIsInitialized(true);
      return;
    }
    
    console.log('[BanContext] Force refreshing ban data from backend...');
    setIsLoading(true);
    try {
      const response = await banService.getBans({ active: true });
      
      if (response.success && response.data) {
        // Map backend bans to frontend format
        const backendBans = Array.isArray(response.data.bans) ? response.data.bans : 
                           Array.isArray(response.data) ? response.data : [];
        
        const mappedBans: UserBan[] = backendBans.map((ban: any) => ({
          id: ban._id || ban.id || `ban_${Date.now()}_${Math.random()}`,
          username: ban.username,
          banType: ban.isPermanent || ban.duration === 'permanent' ? 'permanent' : 'temporary',
          reason: ban.reason || 'other',
          customReason: ban.customReason,
          startTime: ban.createdAt || ban.startTime || new Date().toISOString(),
          endTime: ban.expiresAt || ban.endTime,
          remainingHours: ban.remainingHours,
          bannedBy: ban.bannedBy || 'admin',
          active: ban.active !== false, // Default to true
          appealable: ban.appealable !== false,
          appealSubmitted: ban.appealSubmitted,
          appealText: ban.appealText,
          appealDate: ban.appealDate,
          appealStatus: ban.appealStatus,
          notes: ban.notes,
          reportIds: ban.relatedReportIds || ban.reportIds || [],
        }));

        setBans(mappedBans);
        
        // Schedule expiration for active temporary bans
        mappedBans.forEach((ban) => {
          if (ban.active && ban.banType === 'temporary' && ban.endTime) {
            scheduleExpiration(ban);
          }
        });
        
        console.log('[BanContext] Loaded bans from backend:', mappedBans.length);
      }
    } catch (error) {
      console.error('[BanContext] Error loading bans from backend:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user]);

  // Load from backend on mount
  useEffect(() => {
    if (!isInitialized && user !== undefined) {
      refreshBanData();
    }
  }, [isInitialized, user, refreshBanData]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activeTimers.current.forEach((t) => clearTimeout(t));
      activeTimers.current.clear();
    };
  }, []);

  // ---------- Validation (async because we may look up role) ----------
  const validateBanInput = useCallback(
    async (
      username: string,
      hours: number | 'permanent',
      reason: BanReason,
      targetUserRole?: 'buyer' | 'seller' | 'admin'
    ): Promise<{ valid: boolean; error?: string }> => {
      const sanitized = sanitizeUsername(username);
      if (!sanitized) return { valid: false, error: 'Invalid username format' };

      // Avoid banning reserved/system accounts
      if (isProtectedUsername(sanitized)) {
        return { valid: false, error: 'This account is protected and cannot be banned' };
      }

      // Block admins
      if (targetUserRole === 'admin') {
        return { valid: false, error: 'Admin accounts cannot be banned' };
      }
      if (!targetUserRole) {
        const role = await checkUserRole(sanitized);
        if (role === 'admin') return { valid: false, error: 'Admin accounts cannot be banned' };
      }

      const dur = banDurationSchema.safeParse(hours);
      if (!dur.success) return { valid: false, error: 'Invalid ban duration (max 1 year)' };

      const reasonOk = banReasonSchema.safeParse(reason);
      if (!reasonOk.success) return { valid: false, error: 'Invalid ban reason' };

      return { valid: true };
    },
    []
  );

  // ---------- History helper ----------
  const addBanHistory = useCallback(
    (
      action: BanHistory['action'],
      username: string,
      details: string,
      adminUsername: string,
      metadata?: Record<string, any>
    ) => {
      const historyEntry: BanHistory = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
        username: sanitizeUsername(username) || username,
        action,
        details: sanitizeStrict(details),
        timestamp: new Date().toISOString(),
        adminUsername: sanitizeUsername(adminUsername) || adminUsername,
        metadata,
      };
      setBanHistory((prev) => [...prev, historyEntry]);
    },
    []
  );

  // ---------- Unban ----------
  const clearExpirationTimer = useCallback((banId: string) => {
    const t = activeTimers.current.get(banId);
    if (t) {
      clearTimeout(t);
      activeTimers.current.delete(banId);
    }
  }, []);

  const unbanUser = useCallback(
    async (username: string, adminUsername?: string, reason?: string): Promise<boolean> => {
      // Admin-only
      if (!canAdminAct('unban')) {
        console.warn('[BanContext] Unban blocked: admin privileges required');
        return false;
      }

      try {
        const cleanUsername = sanitizeUsername(username) || username;
        const cleanAdmin = sanitizeUsername(adminUsername || user?.username || 'system')!;
        const cleanReason = reason ? sanitizeStrict(reason) : 'Ban lifted by admin';

        // Call backend to unban
        const response = await banService.unbanUser(cleanUsername, cleanReason);
        
        if (response.success) {
          // Update local state
          const banToUnban = bans.find((b) => b.username === cleanUsername && b.active);
          if (banToUnban) {
            clearExpirationTimer(banToUnban.id);
            setBans(prev => prev.map(b => 
              b.id === banToUnban.id ? { ...b, active: false } : b
            ));
          }
          
          addBanHistory('unbanned', cleanUsername, cleanReason, cleanAdmin);

          // UI event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('banUpdated', {
                detail: { username: cleanUsername, action: 'unbanned' },
              })
            );
          }

          console.log('[BanContext] User unbanned:', cleanUsername);
          return true;
        }
        
        return false;
      } catch (err) {
        console.error('[BanContext] Error unbanning user:', err);
        return false;
      }
    },
    [bans, addBanHistory, clearExpirationTimer, canAdminAct, user?.username]
  );

  // ---------- Scheduler ----------
  const scheduleExpiration = useCallback(
    (ban: UserBan) => {
      if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;

      const ms = new Date(ban.endTime).getTime() - Date.now();
      if (ms <= 0) return;

      console.log(
        `[BanContext] Scheduling expiration for ${ban.username} in ~${Math.round(
          ms / 60000
        )} minutes`
      );

      const t = setTimeout(async () => {
        console.log(`[BanContext] Auto-expiring ban for ${ban.username}`);
        await unbanUser(ban.username, 'system', 'Automatic expiration');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('banExpired', { detail: { banId: ban.id, username: ban.username } })
          );
        }

        activeTimers.current.delete(ban.id);
      }, ms);

      activeTimers.current.set(ban.id, t);
    },
    [unbanUser]
  );

  // ---------- Ban user ----------
  const banUser = useCallback(
    async (
      username: string,
      hours: number | 'permanent',
      reason: BanReason,
      customReason?: string,
      adminUsername?: string,
      reportIds: string[] = [],
      notes?: string,
      targetUserRole?: 'buyer' | 'seller' | 'admin'
    ): Promise<boolean> => {
      // Admin-only
      if (!canAdminAct('ban')) {
        console.warn('[BanContext] Ban blocked: admin privileges required');
        if (typeof window !== 'undefined') {
          alert('Only admins can ban users.');
        }
        return false;
      }

      console.log('[BanContext] Attempting to ban user:', {
        username,
        hours,
        reason,
        targetUserRole,
      });

      const validation = await validateBanInput(username, hours, reason, targetUserRole);
      if (!validation.valid) {
        console.error('[BanContext] Ban validation failed:', validation.error);
        if (
          validation.error === 'Admin accounts cannot be banned' ||
          validation.error === 'This account is protected and cannot be banned'
        ) {
          if (typeof window !== 'undefined') alert(validation.error);
        }
        return false;
      }

      // Sanitize inputs
      const cleanUsername = sanitizeUsername(username) || username;
      const cleanAdmin = sanitizeUsername(adminUsername || user?.username || 'system')!;
      const cleanNotes = notes ? sanitizeStrict(notes) : undefined;

      let cleanCustomReason: string | undefined;
      if (customReason) {
        const cr = customReasonSchema.safeParse(customReason);
        if (!cr.success) {
          console.error('[BanContext] Custom reason too short/long');
          return false;
        }
        cleanCustomReason = sanitizeStrict(cr.data);
      }

      try {
        // Already banned?
        const already = bans.find((b) => b.username === cleanUsername && b.active);
        if (already) {
          console.warn(`[BanContext] ${cleanUsername} is already banned`);
          return false;
        }

        // Save to backend
        const apiResponse = await banService.createBan({
          username: cleanUsername,
          reason: cleanCustomReason || reason,
          customReason: cleanCustomReason,
          duration: hours,
          notes: cleanNotes,
          relatedReportIds: reportIds,
          bannedBy: cleanAdmin,
        });
        
        if (!apiResponse.success) {
          console.error('[BanContext] Failed to save ban to backend:', apiResponse.error);
          alert('Failed to ban user. Please try again.');
          return false;
        }

        // Create local ban object
        const now = new Date();
        const banId = apiResponse.data?.id || Date.now().toString() + Math.random().toString(36).slice(2, 11);
        const end =
          hours === 'permanent'
            ? undefined
            : new Date(now.getTime() + (hours as number) * 60 * 60 * 1000).toISOString();

        const newBan: UserBan = {
          id: banId,
          username: cleanUsername,
          banType: hours === 'permanent' ? 'permanent' : 'temporary',
          reason,
          customReason: cleanCustomReason,
          startTime: now.toISOString(),
          endTime: end,
          remainingHours: hours === 'permanent' ? undefined : (hours as number),
          bannedBy: cleanAdmin,
          active: true,
          appealable: true,
          notes: cleanNotes,
          reportIds: reportIds,
          appealStatus: undefined,
        };

        setBans((prev) => [...prev, newBan]);

        if (newBan.banType === 'temporary' && newBan.endTime) {
          scheduleExpiration(newBan);
        }

        const durationText = hours === 'permanent' ? 'permanently' : `for ${hours} hours`;
        addBanHistory(
          'banned',
          cleanUsername,
          `Banned ${durationText} for ${reason}${cleanCustomReason ? `: ${cleanCustomReason}` : ''}`,
          cleanAdmin,
          { banId }
        );

        console.log('[BanContext] Ban created successfully and saved to backend');
        return true;
      } catch (error) {
        console.error('[BanContext] Error banning user:', error);
        return false;
      }
    },
    [bans, addBanHistory, scheduleExpiration, validateBanInput, canAdminAct, user?.username]
  );

  // ---------- Appeals ----------
  const submitAppeal = useCallback(
    async (username: string, appealText: string, evidence?: File[]): Promise<boolean> => {
      try {
        // Allow the banned user themselves OR an admin acting on their behalf
        const requester = user?.username;
        const isSelf = requester && sanitizeUsername(requester) === sanitizeUsername(username);
        if (!isSelf && !canAdminAct('submitAppeal')) {
          console.warn('[BanContext] Appeal submission blocked: not the user or admin');
          return false;
        }

        const cleanUsername = sanitizeUsername(username) || username;
        const appealValidation = appealTextSchema.safeParse(appealText);
        if (!appealValidation.success) {
          console.error('[BanContext] Invalid appeal text:', appealValidation.error);
          return false;
        }
        const cleanAppealText = sanitizeStrict(appealValidation.data);

        let appealEvidence: string[] = [];
        if (evidence && evidence.length > 0) {
          try {
            // Only first 3 images
            const trimmed = evidence.slice(0, 3);
            appealEvidence = await Promise.all(trimmed.map((f) => compressImage(f)));
          } catch (err) {
            console.error('[BanContext] Evidence processing failed:', err);
          }
        }

        // Find the ban
        const ban = bans.find((b) => b.username === cleanUsername && b.active);
        if (!ban) {
          console.error('[BanContext] No active ban found for user');
          return false;
        }

        // Submit appeal to backend
        const response = await banService.submitAppeal(ban.id, cleanAppealText, appealEvidence);
        
        if (response.success) {
          setBans((prev) =>
            prev.map((b) =>
              b.id === ban.id
                ? {
                    ...b,
                    appealSubmitted: true,
                    appealText: cleanAppealText,
                    appealDate: new Date().toISOString(),
                    appealStatus: 'pending' as AppealStatus,
                    appealEvidence,
                  }
                : b
            )
          );

          addBanHistory(
            'appeal_submitted',
            cleanUsername,
            `Appeal submitted: "${cleanAppealText.substring(0, 100)}${
              cleanAppealText.length > 100 ? '...' : ''
            }"`,
            cleanUsername,
            { evidenceCount: appealEvidence.length }
          );

          return true;
        }
        
        return false;
      } catch (err) {
        console.error('[BanContext] Error submitting appeal:', err);
        return false;
      }
    },
    [bans, addBanHistory, canAdminAct, user?.username]
  );

  const reviewAppeal = useCallback(
    (
      banId: string,
      decision: 'approve' | 'reject' | 'escalate',
      reviewNotes: string,
      adminUsername: string
    ): boolean => {
      // Admin-only
      if (!canAdminAct('reviewAppeal')) {
        console.warn('[BanContext] Review appeal blocked: admin privileges required');
        return false;
      }

      try {
        const cleanNotes = sanitizeStrict(reviewNotes);
        const cleanAdmin = sanitizeUsername(adminUsername || user?.username || 'system')!;

        // Call backend to review appeal
        banService.reviewAppeal(banId, decision, cleanNotes).then(response => {
          if (!response.success) {
            console.error('[BanContext] Failed to save appeal review to backend');
          }
        });

        const review: AppealReview = {
          reviewId: Date.now().toString() + Math.random().toString(36).slice(2, 11),
          banId,
          reviewerAdmin: cleanAdmin,
          reviewNotes: cleanNotes,
          decision,
          reviewDate: new Date().toISOString(),
          escalationReason: decision === 'escalate' ? cleanNotes : undefined,
        };

        setAppealReviews((prev) => [...prev, review]);

        const ban = bans.find((b) => b.id === banId);
        if (!ban) return false;

        if (decision === 'approve') return approveAppeal(banId, cleanAdmin);
        if (decision === 'reject') return rejectAppeal(banId, cleanAdmin, cleanNotes);
        if (decision === 'escalate') return escalateAppeal(banId, cleanAdmin, cleanNotes);

        return true;
      } catch (err) {
        console.error('[BanContext] Error reviewing appeal:', err);
        return false;
      }
    },
    [bans, canAdminAct, user?.username]
  );

  const approveAppeal = useCallback(
    (banId: string, adminUsername: string): boolean => {
      // Admin-only
      if (!canAdminAct('approveAppeal')) return false;

      try {
        const ban = bans.find((b) => b.id === banId);
        if (!ban) return false;

        setBans((prev) =>
          prev.map((b) => (b.id === banId ? { ...b, active: false, appealStatus: 'approved' } : b))
        );

        clearExpirationTimer(banId);
        addBanHistory('appeal_approved', ban.username, 'Appeal approved and ban lifted', adminUsername);
        return true;
      } catch (err) {
        console.error('[BanContext] Error approving appeal:', err);
        return false;
      }
    },
    [bans, addBanHistory, clearExpirationTimer, canAdminAct]
  );

  const rejectAppeal = useCallback(
    (banId: string, adminUsername: string, reason?: string): boolean => {
      // Admin-only
      if (!canAdminAct('rejectAppeal')) return false;

      try {
        const ban = bans.find((b) => b.id === banId);
        if (!ban) return false;

        setBans((prev) =>
          prev.map((b) =>
            b.id === banId
              ? {
                  ...b,
                  appealSubmitted: false,
                  appealText: undefined,
                  appealable: false,
                  appealStatus: 'rejected',
                }
              : b
          )
        );

        addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
        return true;
      } catch (err) {
        console.error('[BanContext] Error rejecting appeal:', err);
        return false;
      }
    },
    [bans, addBanHistory, canAdminAct]
  );

  const escalateAppeal = useCallback(
    (banId: string, adminUsername: string, escalationReason: string): boolean => {
      // Admin-only
      if (!canAdminAct('escalateAppeal')) return false;

      try {
        const ban = bans.find((b) => b.id === banId);
        if (!ban) return false;

        setBans((prev) =>
          prev.map((b) => (b.id === banId ? { ...b, appealStatus: 'escalated' } : b))
        );

        addBanHistory(
          'appeal_escalated',
          ban.username,
          `Appeal escalated: ${sanitizeStrict(escalationReason)}`,
          adminUsername
        );
        return true;
      } catch (err) {
        console.error('[BanContext] Error escalating appeal:', err);
        return false;
      }
    },
    [bans, addBanHistory, canAdminAct]
  );

  // ---------- IP banning (still local for now) ----------
  const banUserIP = useCallback(
    (username: string, ipAddress: string, reason: string): boolean => {
      // Admin-only
      if (!canAdminAct('banUserIP')) {
        console.warn('[BanContext] IP ban blocked: admin privileges required');
        return false;
      }

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
          reason: cleanReason,
        };

        setIPBans((prev) => {
          const existing = prev.find((b) => b.ipAddress === ipValidation.data);
          if (existing) {
            return prev.map((b) =>
              b.ipAddress === ipValidation.data
                ? { ...b, bannedUsernames: [...new Set([...b.bannedUsernames, cleanUsername])] }
                : b
            );
          }
          return [...prev, ipBan];
        });

        return true;
      } catch (err) {
        console.error('[BanContext] Error banning IP:', err);
        return false;
      }
    },
    [canAdminAct]
  );

  const isIPBanned = useCallback(
    (ipAddress: string): boolean => {
      const now = new Date();
      return ipBans.some(
        (ban) => ban.ipAddress === ipAddress && (!ban.expiryDate || new Date(ban.expiryDate) > now)
      );
    },
    [ipBans]
  );

  // ---------- Queries ----------
  const isUserBanned = useCallback(
    (username: string): UserBan | null => {
      const cleanUsername = sanitizeUsername(username) || username;
      const activeBan = bans.find((b) => b.username === cleanUsername && b.active);
      if (!activeBan) return null;

      if (activeBan.banType === 'temporary' && activeBan.endTime) {
        const now = new Date();
        const end = new Date(activeBan.endTime);
        if (now >= end) {
          // Auto unban expired
          unbanUser(cleanUsername, 'system', 'Temporary ban expired');
          return null;
        }
        const remainingMs = end.getTime() - now.getTime();
        activeBan.remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
      }

      return activeBan;
    },
    [bans, unbanUser]
  );

  const getBanInfo = useCallback((username: string): UserBan | null => {
    return isUserBanned(username);
  }, [isUserBanned]);

  const getActiveBans = useCallback((): UserBan[] => {
    const active = bans.filter((b) => b.active).map((b) => {
      if (b.banType === 'temporary' && b.endTime) {
        const now = new Date();
        const end = new Date(b.endTime);
        const remainingMs = end.getTime() - now.getTime();
        b.remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
      }
      return b;
    });

    console.log('[BanContext] Getting active bans:', {
      total: bans.length,
      active: active.length,
      usernames: active.map((b) => b.username),
    });

    return active;
  }, [bans]);

  const getExpiredBans = useCallback((): UserBan[] => {
    return bans.filter((b) => !b.active);
  }, [bans]);

  const getUserBanHistory = useCallback(
    (username: string): UserBan[] => bans.filter((b) => b.username === username),
    [bans]
  );

  const updateExpiredBans = useCallback(() => {
    const now = new Date();
    let changed = false;

    setBans((prev) =>
      prev.map((b) => {
        if (b.active && b.banType === 'temporary' && b.endTime) {
          if (now >= new Date(b.endTime)) {
            clearExpirationTimer(b.id);
            changed = true;
            addBanHistory('unbanned', b.username, 'Temporary ban expired automatically', 'system');
            return { ...b, active: false };
          }
        }
        return b;
      })
    );

    if (changed) console.log('[BanContext] Expired bans updated');
  }, [addBanHistory, clearExpirationTimer]);

  const getBanStats = useCallback(() => {
    const active = getActiveBans();
    const now = new Date();
    const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const bansByReason: Record<BanReason, number> = {
      harassment: 0,
      spam: 0,
      inappropriate_content: 0,
      scam: 0,
      underage: 0,
      payment_fraud: 0,
      other: 0,
    };
    active.forEach((b) => {
      bansByReason[b.reason]++;
    });

    const allAppeals = bans.filter((b) => b.appealSubmitted);
    const appealStats = {
      totalAppeals: allAppeals.length,
      pendingAppeals: allAppeals.filter((b) => b.appealStatus === 'pending').length,
      approvedAppeals: banHistory.filter((h) => h.action === 'appeal_approved').length,
      rejectedAppeals: banHistory.filter((h) => h.action === 'appeal_rejected').length,
    };

    const stats = {
      totalActiveBans: active.length,
      temporaryBans: active.filter((b) => b.banType === 'temporary').length,
      permanentBans: active.filter((b) => b.banType === 'permanent').length,
      pendingAppeals: active.filter((b) => b.appealSubmitted && b.appealStatus === 'pending').length,
      recentBans24h: bans.filter((b) => new Date(b.startTime) >= hours24Ago).length,
      bansByReason,
      appealStats,
    };

    console.log('[BanContext] Ban stats:', stats);
    return stats;
  }, [getActiveBans, bans, banHistory]);

  return (
    <BanContext.Provider
      value={{
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
        refreshBanData,
        isLoading,
      }}
    >
      {children}
    </BanContext.Provider>
  );
};

export const useBans = () => {
  const ctx = useContext(BanContext);
  if (!ctx) {
    throw new Error('useBans must be used within a BanProvider');
  }
  return ctx;
};
