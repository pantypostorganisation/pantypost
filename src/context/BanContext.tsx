// src/context/BanContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { storageService } from '@/services';

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

type BanContextType = {
  bans: UserBan[];
  banHistory: BanHistory[];
  appealReviews: AppealReview[];
  ipBans: IPBan[];
  
  // Enhanced ban management
  banUser: (username: string, hours: number | 'permanent', reason: BanReason, customReason?: string, adminUsername?: string, reportIds?: string[], notes?: string) => Promise<boolean>;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => boolean;
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
  validateBanInput: (username: string, hours: number | 'permanent', reason: BanReason) => { valid: boolean; error?: string };
  
  // Force refresh
  refreshBanData: () => Promise<void>;
};

const BanContext = createContext<BanContextType | undefined>(undefined);

// Security utilities
const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, 1000); // Prevent extremely long inputs
};

const validateUsername = (username: string): boolean => {
  if (!username || typeof username !== 'string') return false;
  if (username.length > 50) return false;
  return /^[a-zA-Z0-9_-]+$/.test(username);
};

const validateBanDuration = (hours: number | 'permanent'): boolean => {
  if (hours === 'permanent') return true;
  if (typeof hours !== 'number') return false;
  return hours > 0 && hours <= 8760; // Max 1 year
};

const validateBanReason = (reason: string): boolean => {
  const validReasons: BanReason[] = ['harassment', 'spam', 'inappropriate_content', 'scam', 'underage', 'payment_fraud', 'other'];
  return validReasons.includes(reason as BanReason);
};

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

// Mock data generator for development
const generateMockBanData = (): { bans: UserBan[], history: BanHistory[] } => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const mockBans: UserBan[] = [
    // Active temporary ban with appeal
    {
      id: 'ban-001',
      username: 'troublemaker123',
      banType: 'temporary',
      reason: 'harassment',
      customReason: 'Repeatedly sending inappropriate messages to multiple users',
      startTime: now.toISOString(),
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      remainingHours: 24,
      bannedBy: 'admin',
      active: true,
      appealable: true,
      appealSubmitted: true,
      appealText: 'I apologize for my behavior. I didn\'t realize my messages were inappropriate. I promise to follow the community guidelines from now on.',
      appealDate: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      appealStatus: 'pending',
      notes: 'Multiple users reported this account for harassment',
      reportIds: ['report-123', 'report-124', 'report-125']
    },
    // Active permanent ban
    {
      id: 'ban-002',
      username: 'scammer456',
      banType: 'permanent',
      reason: 'scam',
      customReason: 'Attempted to scam multiple buyers with fake listings',
      startTime: twoDaysAgo.toISOString(),
      bannedBy: 'admin',
      active: true,
      appealable: true,
      notes: 'Evidence of fraudulent activity confirmed',
      reportIds: ['report-200', 'report-201']
    },
    // Another active temporary ban
    {
      id: 'ban-004',
      username: 'spammer999',
      banType: 'temporary',
      reason: 'spam',
      customReason: 'Sending promotional messages to users',
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      endTime: new Date(now.getTime() + 46 * 60 * 60 * 1000).toISOString(), // 46 hours from now
      remainingHours: 46,
      bannedBy: 'moderator1',
      active: true,
      appealable: true,
      notes: 'First offense - 48 hour ban'
    },
    // Expired ban
    {
      id: 'ban-003',
      username: 'oldbanner789',
      banType: 'temporary',
      reason: 'spam',
      customReason: 'Mass messaging users with promotional content',
      startTime: oneWeekAgo.toISOString(),
      endTime: twoDaysAgo.toISOString(),
      bannedBy: 'moderator1',
      active: false,
      appealable: false,
      notes: 'First offense - temporary ban issued'
    }
  ];
  
  const mockHistory: BanHistory[] = [
    {
      id: 'history-001',
      username: 'troublemaker123',
      action: 'banned',
      details: 'Banned for 24 hours for harassment: Repeatedly sending inappropriate messages to multiple users',
      timestamp: now.toISOString(),
      adminUsername: 'admin'
    },
    {
      id: 'history-002',
      username: 'troublemaker123',
      action: 'appeal_submitted',
      details: 'Appeal submitted: "I apologize for my behavior..."',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      adminUsername: 'troublemaker123'
    },
    {
      id: 'history-003',
      username: 'scammer456',
      action: 'banned',
      details: 'Permanently banned for scam: Attempted to scam multiple buyers with fake listings',
      timestamp: twoDaysAgo.toISOString(),
      adminUsername: 'admin'
    },
    {
      id: 'history-004',
      username: 'spammer999',
      action: 'banned',
      details: 'Banned for 48 hours for spam: Sending promotional messages to users',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      adminUsername: 'moderator1'
    },
    {
      id: 'history-005',
      username: 'oldbanner789',
      action: 'banned',
      details: 'Banned for 24 hours for spam: Mass messaging users with promotional content',
      timestamp: oneWeekAgo.toISOString(),
      adminUsername: 'moderator1'
    },
    {
      id: 'history-006',
      username: 'oldbanner789',
      action: 'unbanned',
      details: 'Temporary ban expired automatically',
      timestamp: twoDaysAgo.toISOString(),
      adminUsername: 'system'
    }
  ];
  
  return { bans: mockBans, history: mockHistory };
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
      
      console.log('[BanContext] Loaded from storage:', {
        bans: storedBans.length,
        history: storedHistory.length,
        appealReviews: storedAppealReviews.length,
        ipBans: storedIPBans.length
      });
      
      // If no data exists and we're in development, create mock data
      if (storedBans.length === 0 && storedHistory.length === 0 && (process.env.NODE_ENV === 'development' || forceRefresh)) {
        console.log('[BanContext] No ban data found, creating mock data...');
        const { bans: mockBans, history: mockHistory } = generateMockBanData();
        
        setBans(mockBans);
        setBanHistory(mockHistory);
        
        // Save mock data to storage
        isSavingRef.current = true;
        await storageService.setItem('panty_user_bans', mockBans);
        await storageService.setItem('panty_ban_history', mockHistory);
        isSavingRef.current = false;
        
        console.log('[BanContext] Mock data created:', {
          activeBans: mockBans.filter(b => b.active).length,
          totalBans: mockBans.length
        });
        
        // Schedule expiration for active temporary bans
        mockBans.forEach((ban: UserBan) => {
          if (ban.active && ban.banType === 'temporary' && ban.endTime) {
            scheduleExpiration(ban);
          }
        });
      } else {
        // Update expired bans before setting
        const now = new Date();
        const updatedBans = storedBans.map(ban => {
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
        setBanHistory(storedHistory);
        
        console.log('[BanContext] Data loaded:', {
          activeBans: updatedBans.filter(b => b.active).length,
          totalBans: updatedBans.length
        });
        
        // Save updated bans if any expired
        if (updatedBans.some((ban, idx) => ban.active !== storedBans[idx]?.active)) {
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
      }
      
      setAppealReviews(storedAppealReviews);
      setIPBans(storedIPBans);
      
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

  // Enhanced validation function
  const validateBanInput = (username: string, hours: number | 'permanent', reason: BanReason): { valid: boolean; error?: string } => {
    if (!validateUsername(username)) {
      return { valid: false, error: 'Invalid username format' };
    }
    
    if (!validateBanDuration(hours)) {
      return { valid: false, error: 'Invalid ban duration (max 1 year)' };
    }
    
    if (!validateBanReason(reason)) {
      return { valid: false, error: 'Invalid ban reason' };
    }
    
    return { valid: true };
  };

  // Add to ban history
  const addBanHistory = useCallback((action: BanHistory['action'], username: string, details: string, adminUsername: string, metadata?: Record<string, any>) => {
    const historyEntry: BanHistory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username: sanitizeString(username),
      action,
      details: sanitizeString(details),
      timestamp: new Date().toISOString(),
      adminUsername: sanitizeString(adminUsername),
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
    notes?: string
  ): Promise<boolean> => {
    console.log('[BanContext] Attempting to ban user:', { username, hours, reason });
    
    // Validate input
    const validation = validateBanInput(username, hours, reason);
    if (!validation.valid) {
      console.error('[BanContext] Ban validation failed:', validation.error);
      return false;
    }
    
    // Sanitize inputs
    const cleanUsername = sanitizeString(username);
    const cleanCustomReason = customReason ? sanitizeString(customReason) : undefined;
    const cleanAdminUsername = sanitizeString(adminUsername);
    const cleanNotes = notes ? sanitizeString(notes) : undefined;
    
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
        remainingHours: hours === 'permanent' ? undefined : hours as number,
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
  }, [bans, addBanHistory, scheduleExpiration]);

  // Enhanced unban function
  const unbanUser = useCallback((username: string, adminUsername: string = 'system', reason?: string): boolean => {
    try {
      const cleanUsername = sanitizeString(username);
      const cleanAdminUsername = sanitizeString(adminUsername);
      const cleanReason = reason ? sanitizeString(reason) : undefined;
      
      console.log('[BanContext] Unbanning user:', { username: cleanUsername, admin: cleanAdminUsername });
      
      let unbanned = false;
      setBans(prev => prev.map(ban => {
        if (ban.username === cleanUsername && ban.active) {
          // Clear any active timer
          clearExpirationTimer(ban.id);
          unbanned = true;
          return { ...ban, active: false };
        }
        return ban;
      }));
      
      if (unbanned) {
        addBanHistory('unbanned', cleanUsername, cleanReason || 'Ban lifted by admin', cleanAdminUsername);
        console.log('[BanContext] User unbanned successfully');
      } else {
        console.warn('[BanContext] No active ban found for user:', cleanUsername);
      }
      
      return unbanned;
    } catch (error) {
      console.error('[BanContext] Error unbanning user:', error);
      return false;
    }
  }, [addBanHistory, clearExpirationTimer]);

  // Enhanced appeal submission with evidence
  const submitAppeal = useCallback(async (username: string, appealText: string, evidence?: File[]): Promise<boolean> => {
    try {
      const cleanUsername = sanitizeString(username);
      const cleanAppealText = sanitizeString(appealText);
      
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
      const cleanReviewNotes = sanitizeString(reviewNotes);
      const cleanAdminUsername = sanitizeString(adminUsername);
      
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
      const cleanUsername = sanitizeString(username);
      const cleanIPAddress = sanitizeString(ipAddress);
      const cleanReason = sanitizeString(reason);
      
      const ipBan: IPBan = {
        ipAddress: cleanIPAddress,
        bannedUsernames: [cleanUsername],
        banDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        reason: cleanReason
      };
      
      setIPBans(prev => {
        const existing = prev.find(ban => ban.ipAddress === cleanIPAddress);
        if (existing) {
          return prev.map(ban => 
            ban.ipAddress === cleanIPAddress 
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
