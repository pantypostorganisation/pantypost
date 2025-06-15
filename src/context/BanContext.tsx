// src/context/BanContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { safeStorage } from '@/utils/safeStorage';

export type BanReason = 
  | 'inappropriate_content' 
  | 'harassment'
  | 'spam'
  | 'scamming'
  | 'underage'
  | 'fake_profile'
  | 'illegal_activity'
  | 'other';

export type AppealStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'escalated';

export interface UserBan {
  id: string;
  username: string;
  banType: 'temporary' | 'permanent';
  reason: BanReason;
  customReason?: string;
  startTime: string;
  endTime?: string; // undefined for permanent bans
  remainingHours?: number;
  bannedBy: string;
  active: boolean;
  appealable: boolean;
  appealSubmitted?: boolean;
  appealMessage?: string;
  appealSubmittedAt?: string;
  appealStatus?: AppealStatus;
  appealReviewedBy?: string;
  appealReviewedAt?: string;
  appealDecisionReason?: string;
  notes?: string;
  reportIds?: string[];
  evidenceFiles?: string[]; // Base64 image strings
}

export interface BanHistory {
  id: string;
  action: 'banned' | 'unbanned' | 'appeal_submitted' | 'appeal_approved' | 'appeal_rejected' | 'modified';
  username: string;
  timestamp: string;
  details: string;
  performedBy: string;
  metadata?: {
    banId?: string;
    duration?: number;
    reason?: string;
    oldStatus?: string;
    newStatus?: string;
  };
}

export interface AppealReview {
  id: string;
  banId: string;
  reviewerId: string;
  decision: 'approve' | 'reject' | 'escalate';
  comments: string;
  timestamp: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface IPBan {
  id: string;
  ipAddress: string;
  associatedUsernames: string[];
  reason: string;
  bannedAt: string;
  bannedBy: string;
  active: boolean;
}

type BanContextType = {
  bans: UserBan[];
  banHistory: BanHistory[];
  appealReviews: AppealReview[];
  ipBans: IPBan[];
  banUser: (
    username: string, 
    hours: number | 'permanent', 
    reason: BanReason, 
    customReason?: string,
    adminUsername?: string,
    reportIds?: string[],
    notes?: string
  ) => Promise<boolean>;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => void;
  isUserBanned: (username: string) => boolean;
  getBanInfo: (username: string) => UserBan | null;
  getActiveBans: () => UserBan[];
  getExpiredBans: () => UserBan[];
  getUserBanHistory: (username: string) => BanHistory[];
  submitAppeal: (banId: string, appealMessage: string, evidenceFiles?: string[]) => Promise<boolean>;
  reviewAppeal: (banId: string, decision: 'approve' | 'reject' | 'escalate', reviewerId: string, comments: string) => void;
  approveAppeal: (banId: string, reviewerId: string, comments: string) => void;
  rejectAppeal: (banId: string, reviewerId: string, comments: string) => void;
  escalateAppeal: (banId: string, reviewerId: string, comments: string) => void;
  banUserIP: (ipAddress: string, username: string, reason: string, adminUsername: string) => void;
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
  validateBanInput: (username: string, hours: number | 'permanent', reason: BanReason) => { valid: boolean; error?: string };
};

const BanContext = createContext<BanContextType | undefined>(undefined);

// Validation utilities
const validateUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
};

const validateBanDuration = (hours: number | 'permanent'): boolean => {
  if (hours === 'permanent') return true;
  return hours > 0 && hours <= 8760; // Max 1 year
};

const validateBanReason = (reason: BanReason): boolean => {
  const validReasons: BanReason[] = [
    'inappropriate_content', 'harassment', 'spam', 'scamming', 
    'underage', 'fake_profile', 'illegal_activity', 'other'
  ];
  return validReasons.includes(reason);
};

// Sanitization utility
const sanitizeString = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/[<>]/g, '')
              .trim();
};

// Image compression utility
const compressImage = (file: File, maxDimension: number = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
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
  
  // Track active timers to prevent memory leaks
  const activeTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBans = safeStorage.getItem<UserBan[]>('panty_user_bans', []);
      setBans(storedBans || []);
      // Schedule expiration for active temporary bans
      if (storedBans && storedBans.length > 0) {
        storedBans.forEach((ban: UserBan) => {
          if (ban.active && ban.banType === 'temporary' && ban.endTime) {
            scheduleExpiration(ban);
          }
        });
      }
      
      const storedHistory = safeStorage.getItem<BanHistory[]>('panty_ban_history', []);
      setBanHistory(storedHistory || []);
      
      const storedAppealReviews = safeStorage.getItem<AppealReview[]>('panty_appeal_reviews', []);
      setAppealReviews(storedAppealReviews || []);
      
      const storedIPBans = safeStorage.getItem<IPBan[]>('panty_ip_bans', []);
      setIPBans(storedIPBans || []);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem('panty_user_bans', bans);
    }
  }, [bans]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem('panty_ban_history', banHistory);
    }
  }, [banHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem('panty_appeal_reviews', appealReviews);
    }
  }, [appealReviews]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeStorage.setItem('panty_ip_bans', ipBans);
    }
  }, [ipBans]);

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
  const addBanHistory = (action: BanHistory['action'], username: string, details: string, adminUsername: string, metadata?: BanHistory['metadata']) => {
    const entry: BanHistory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      action,
      username,
      timestamp: new Date().toISOString(),
      details,
      performedBy: adminUsername,
      metadata
    };
    setBanHistory(prev => [...prev, entry]);
  };

  // Schedule ban expiration
  const scheduleExpiration = (ban: UserBan) => {
    if (ban.banType === 'temporary' && ban.endTime) {
      const endTime = new Date(ban.endTime).getTime();
      const now = Date.now();
      const delay = endTime - now;

      if (delay > 0) {
        const timerId = setTimeout(() => {
          setBans(prev => prev.map(b => 
            b.id === ban.id ? { ...b, active: false } : b
          ));
          activeTimers.current.delete(ban.id);
          addBanHistory('unbanned', ban.username, 'Ban expired automatically', 'system');
        }, delay);

        activeTimers.current.set(ban.id, timerId);
      }
    }
  };

  // Clear expiration timer
  const clearExpirationTimer = (banId: string) => {
    const timer = activeTimers.current.get(banId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.current.delete(banId);
    }
  };

  // Update expired bans (called periodically)
  const updateExpiredBans = () => {
    const now = new Date();
    setBans(prev => prev.map(ban => {
      if (ban.active && ban.banType === 'temporary' && ban.endTime) {
        const endTime = new Date(ban.endTime);
        if (now >= endTime) {
          clearExpirationTimer(ban.id);
          addBanHistory('unbanned', ban.username, 'Ban expired automatically', 'system');
          return { ...ban, active: false };
        } else {
          // Update remaining hours
          const remainingMs = endTime.getTime() - now.getTime();
          const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
          return { ...ban, remainingHours };
        }
      }
      return ban;
    }));
  };

  // Periodically check for expired bans
  useEffect(() => {
    const interval = setInterval(updateExpiredBans, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const banUser = async (
    username: string, 
    hours: number | 'permanent', 
    reason: BanReason, 
    customReason?: string, 
    adminUsername: string = 'system',
    reportIds: string[] = [],
    notes?: string
  ): Promise<boolean> => {
    // Validate input
    const validation = validateBanInput(username, hours, reason);
    if (!validation.valid) {
      console.error('Ban validation failed:', validation.error);
      return false;
    }
    
    // Sanitize inputs
    const cleanUsername = sanitizeString(username);
    const cleanCustomReason = customReason ? sanitizeString(customReason) : undefined;
    const cleanAdminUsername = sanitizeString(adminUsername);
    const cleanNotes = notes ? sanitizeString(notes) : undefined;
    
    // Race condition protection
    const lockKey = `ban_user_${cleanUsername}`;
    const existingLock = safeStorage.getItem(lockKey, null);
    
    if (existingLock) {
      try {
        const lockData = JSON.parse(existingLock);
        if (Date.now() - lockData.timestamp < 30000) { // 30 second lock
          console.warn(`Ban operation already in progress for ${cleanUsername}`);
          return false;
        }
      } catch (e) {
        // Invalid lock data, proceed
      }
    }
    
    // Set lock
    safeStorage.setItem(lockKey, JSON.stringify({
      timestamp: Date.now(),
      adminUser: cleanAdminUsername
    }));
    
    try {
      // Check if user is already banned
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
        remainingHours: hours === 'permanent' ? undefined : hours as number,
        bannedBy: cleanAdminUsername,
        active: true,
        appealable: true,
        notes: cleanNotes,
        reportIds: reportIds,
        appealStatus: 'pending'
      };

      setBans(prev => [...prev, newBan]);
      
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
        {
          banId,
          duration: hours === 'permanent' ? undefined : hours,
          reason
        }
      );

      return true;
    } finally {
      // Clear lock
      safeStorage.removeItem(lockKey);
    }
  };

  const unbanUser = (username: string, adminUsername: string = 'system', reason?: string) => {
    const ban = bans.find(b => b.username === username && b.active);
    if (ban) {
      clearExpirationTimer(ban.id);
      setBans(prev => prev.map(b => 
        b.username === username && b.active ? { ...b, active: false } : b
      ));
      addBanHistory(
        'unbanned', 
        username, 
        `Manually unbanned${reason ? `: ${reason}` : ''}`, 
        adminUsername
      );
    }
  };

  const isUserBanned = (username: string): boolean => {
    const ban = bans.find(b => b.username === username && b.active);
    if (!ban) return false;
    
    if (ban.banType === 'temporary' && ban.endTime) {
      return new Date() < new Date(ban.endTime);
    }
    
    return true;
  };

  const getBanInfo = (username: string): UserBan | null => {
    return bans.find(b => b.username === username && b.active) || null;
  };

  const getActiveBans = (): UserBan[] => {
    return bans.filter(ban => ban.active);
  };

  const getExpiredBans = (): UserBan[] => {
    return bans.filter(ban => !ban.active);
  };

  const getUserBanHistory = (username: string): BanHistory[] => {
    return banHistory.filter(entry => entry.username === username);
  };

  const submitAppeal = async (banId: string, appealMessage: string, evidenceFiles?: string[]): Promise<boolean> => {
    const ban = bans.find(b => b.id === banId);
    if (!ban || !ban.appealable || ban.appealSubmitted) {
      return false;
    }

    // Compress evidence files if provided
    let compressedEvidence: string[] = [];
    if (evidenceFiles && evidenceFiles.length > 0) {
      try {
        // Limit to 3 files
        const limitedFiles = evidenceFiles.slice(0, 3);
        compressedEvidence = limitedFiles; // Already base64 strings
      } catch (error) {
        console.error('Error processing evidence files:', error);
      }
    }

    setBans(prev => prev.map(b => 
      b.id === banId 
        ? { 
            ...b, 
            appealSubmitted: true, 
            appealMessage: sanitizeString(appealMessage),
            appealSubmittedAt: new Date().toISOString(),
            appealStatus: 'pending',
            evidenceFiles: compressedEvidence
          } 
        : b
    ));

    addBanHistory(
      'appeal_submitted', 
      ban.username, 
      'Appeal submitted for review', 
      ban.username
    );

    return true;
  };

  const reviewAppeal = (banId: string, decision: 'approve' | 'reject' | 'escalate', reviewerId: string, comments: string) => {
    const review: AppealReview = {
      id: Date.now().toString(),
      banId,
      reviewerId,
      decision,
      comments: sanitizeString(comments),
      timestamp: new Date().toISOString()
    };

    setAppealReviews(prev => [...prev, review]);

    if (decision === 'approve') {
      approveAppeal(banId, reviewerId, comments);
    } else if (decision === 'reject') {
      rejectAppeal(banId, reviewerId, comments);
    } else {
      escalateAppeal(banId, reviewerId, comments);
    }
  };

  const approveAppeal = (banId: string, reviewerId: string, comments: string) => {
    const ban = bans.find(b => b.id === banId);
    if (!ban) return;

    clearExpirationTimer(banId);
    
    setBans(prev => prev.map(b => 
      b.id === banId 
        ? { 
            ...b, 
            active: false,
            appealStatus: 'approved',
            appealReviewedBy: reviewerId,
            appealReviewedAt: new Date().toISOString(),
            appealDecisionReason: sanitizeString(comments)
          } 
        : b
    ));

    addBanHistory(
      'appeal_approved', 
      ban.username, 
      `Appeal approved: ${comments}`, 
      reviewerId
    );
  };

  const rejectAppeal = (banId: string, reviewerId: string, comments: string) => {
    const ban = bans.find(b => b.id === banId);
    if (!ban) return;

    setBans(prev => prev.map(b => 
      b.id === banId 
        ? { 
            ...b, 
            appealStatus: 'rejected',
            appealReviewedBy: reviewerId,
            appealReviewedAt: new Date().toISOString(),
            appealDecisionReason: sanitizeString(comments)
          } 
        : b
    ));

    addBanHistory(
      'appeal_rejected', 
      ban.username, 
      `Appeal rejected: ${comments}`, 
      reviewerId
    );
  };

  const escalateAppeal = (banId: string, reviewerId: string, comments: string) => {
    const ban = bans.find(b => b.id === banId);
    if (!ban) return;

    setBans(prev => prev.map(b => 
      b.id === banId 
        ? { 
            ...b, 
            appealStatus: 'escalated'
          } 
        : b
    ));

    // Add to review queue with high priority
    const review: AppealReview = {
      id: Date.now().toString(),
      banId,
      reviewerId,
      decision: 'escalate',
      comments: sanitizeString(comments),
      timestamp: new Date().toISOString(),
      priority: 'high'
    };
    
    setAppealReviews(prev => [...prev, review]);
  };

  const banUserIP = (ipAddress: string, username: string, reason: string, adminUsername: string) => {
    const existingBan = ipBans.find(ban => ban.ipAddress === ipAddress);
    
    if (existingBan) {
      // Add username to existing IP ban
      if (!existingBan.associatedUsernames.includes(username)) {
        setIPBans(prev => prev.map(ban => 
          ban.ipAddress === ipAddress 
            ? { ...ban, associatedUsernames: [...ban.associatedUsernames, username] }
            : ban
        ));
      }
    } else {
      // Create new IP ban
      const newIPBan: IPBan = {
        id: Date.now().toString(),
        ipAddress,
        associatedUsernames: [username],
        reason: sanitizeString(reason),
        bannedAt: new Date().toISOString(),
        bannedBy: adminUsername,
        active: true
      };
      
      setIPBans(prev => [...prev, newIPBan]);
    }
  };

  const isIPBanned = (ipAddress: string): boolean => {
    return ipBans.some(ban => ban.ipAddress === ipAddress && ban.active);
  };

  // Enhanced statistics function
  const getBanStats = () => {
    const activeBans = bans.filter(ban => ban.active);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Ban reason breakdown
    const bansByReason: Record<BanReason, number> = {
      inappropriate_content: 0,
      harassment: 0,
      spam: 0,
      scamming: 0,
      underage: 0,
      fake_profile: 0,
      illegal_activity: 0,
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
    
    return {
      totalActiveBans: activeBans.length,
      temporaryBans: activeBans.filter(ban => ban.banType === 'temporary').length,
      permanentBans: activeBans.filter(ban => ban.banType === 'permanent').length,
      pendingAppeals: activeBans.filter(ban => ban.appealSubmitted && ban.appealStatus === 'pending').length,
      recentBans24h: bans.filter(ban => new Date(ban.startTime) >= twentyFourHoursAgo).length,
      bansByReason,
      appealStats
    };
  };

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
      validateBanInput
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