// src/context/BanContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

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
  escalationLevel?: number; // Progressive discipline level
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

export type BanEscalation = {
  username: string;
  offenseCount: number;
  lastOffenseDate: string;
  escalationLevel: number; // 1-5: Warning -> 1h -> 24h -> 7d -> Permanent
  offenseHistory: {
    reason: BanReason;
    date: string;
    weight: number;
  }[];
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
  escalations: BanEscalation[];
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
  
  // Progressive discipline
  getRecommendedBanDuration: (username: string, reason: BanReason) => { duration: number | 'permanent', level: number, reasoning: string };
  getUserEscalation: (username: string) => BanEscalation;
  resetUserEscalation: (username: string, adminUsername: string) => boolean;
  
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
    escalationStats: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
  };
  
  // Validation
  validateBanInput: (username: string, hours: number | 'permanent', reason: BanReason) => { valid: boolean; error?: string };
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

export const BanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [banHistory, setBanHistory] = useState<BanHistory[]>([]);
  const [escalations, setEscalations] = useState<BanEscalation[]>([]);
  const [appealReviews, setAppealReviews] = useState<AppealReview[]>([]);
  const [ipBans, setIPBans] = useState<IPBan[]>([]);
  
  // Track active timers to prevent memory leaks
  const activeTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBans = localStorage.getItem('panty_user_bans');
      const storedHistory = localStorage.getItem('panty_ban_history');
      const storedEscalations = localStorage.getItem('panty_ban_escalations');
      const storedAppealReviews = localStorage.getItem('panty_appeal_reviews');
      const storedIPBans = localStorage.getItem('panty_ip_bans');
      
      if (storedBans) {
        const parsedBans = JSON.parse(storedBans);
        setBans(parsedBans);
        // Schedule expiration for active temporary bans
        parsedBans.forEach((ban: UserBan) => {
          if (ban.active && ban.banType === 'temporary' && ban.endTime) {
            scheduleExpiration(ban);
          }
        });
      }
      
      if (storedHistory) setBanHistory(JSON.parse(storedHistory));
      if (storedEscalations) setEscalations(JSON.parse(storedEscalations));
      if (storedAppealReviews) setAppealReviews(JSON.parse(storedAppealReviews));
      if (storedIPBans) setIPBans(JSON.parse(storedIPBans));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_user_bans', JSON.stringify(bans));
    }
  }, [bans]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_ban_history', JSON.stringify(banHistory));
    }
  }, [banHistory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_ban_escalations', JSON.stringify(escalations));
    }
  }, [escalations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_appeal_reviews', JSON.stringify(appealReviews));
    }
  }, [appealReviews]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_ip_bans', JSON.stringify(ipBans));
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
  const addBanHistory = (action: BanHistory['action'], username: string, details: string, adminUsername: string, metadata?: Record<string, any>) => {
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
  };

  // Get user escalation info
  const getUserEscalation = useCallback((username: string): BanEscalation => {
    const existing = escalations.find(e => e.username === username);
    if (existing) return existing;
    
    return {
      username,
      offenseCount: 0,
      lastOffenseDate: '',
      escalationLevel: 0,
      offenseHistory: []
    };
  }, [escalations]);

  // Calculate recommended ban duration based on escalation
  const getRecommendedBanDuration = useCallback((username: string, reason: BanReason): { duration: number | 'permanent', level: number, reasoning: string } => {
    const escalation = getUserEscalation(username);
    
    const offenseWeights: Record<BanReason, number> = {
      harassment: 2,
      spam: 1,
      inappropriate_content: 2,
      scam: 3,
      underage: 5, // Immediate permanent
      payment_fraud: 3,
      other: 1
    };
    
    const weight = offenseWeights[reason] || 1;
    const newLevel = Math.min(escalation.escalationLevel + weight, 5);
    
    // Ban durations by level
    const banLevels = [
      { duration: 0, description: 'Warning only' },
      { duration: 1, description: '1 hour timeout' },
      { duration: 24, description: '24 hour ban' },
      { duration: 168, description: '7 day ban' },
      { duration: 'permanent' as const, description: 'Permanent ban' }
    ];
    
    const recommendedBan = banLevels[Math.min(newLevel - 1, 4)];
    
    let reasoning = `Level ${newLevel} offense (${escalation.offenseCount + 1} total offenses). `;
    reasoning += `${reason} carries a weight of ${weight}. `;
    reasoning += `Recommended: ${recommendedBan.description}`;
    
    // Special case for underage - immediate permanent
    if (reason === 'underage') {
      return {
        duration: 'permanent',
        level: 5,
        reasoning: 'Underage violation requires immediate permanent ban per platform policy.'
      };
    }
    
    return {
      duration: recommendedBan.duration,
      level: newLevel,
      reasoning
    };
  }, [getUserEscalation]);

  // Update user escalation
  const updateUserEscalation = (username: string, reason: BanReason, weight: number) => {
    setEscalations(prev => {
      const existing = prev.find(e => e.username === username);
      const newOffense = {
        reason,
        date: new Date().toISOString(),
        weight
      };
      
      if (existing) {
        return prev.map(e => 
          e.username === username 
            ? {
                ...e,
                offenseCount: e.offenseCount + 1,
                lastOffenseDate: new Date().toISOString(),
                escalationLevel: Math.min(e.escalationLevel + weight, 5),
                offenseHistory: [...e.offenseHistory, newOffense]
              }
            : e
        );
      } else {
        return [...prev, {
          username,
          offenseCount: 1,
          lastOffenseDate: new Date().toISOString(),
          escalationLevel: weight,
          offenseHistory: [newOffense]
        }];
      }
    });
  };

  // Schedule automatic expiration
  const scheduleExpiration = useCallback((ban: UserBan) => {
    if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;
    
    const timeUntilExpiry = new Date(ban.endTime).getTime() - Date.now();
    
    if (timeUntilExpiry > 0) {
      const timer = setTimeout(() => {
        console.log(`Auto-expiring ban for ${ban.username}`);
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
  const clearExpirationTimer = (banId: string) => {
    const timer = activeTimers.current.get(banId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.current.delete(banId);
    }
  };

  // Enhanced ban user function with race condition protection
  const banUser = async (
    username: string, 
    hours: number | 'permanent', 
    reason: BanReason, 
    customReason?: string, 
    adminUsername: string = 'system',
    reportIds?: string[],
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
    const existingLock = localStorage.getItem(lockKey);
    
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
    localStorage.setItem(lockKey, JSON.stringify({
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
      
      // Get recommended escalation level
      const recommendation = getRecommendedBanDuration(cleanUsername, reason);
      
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
        reportIds: reportIds || [],
        escalationLevel: recommendation.level,
        appealStatus: 'pending'
      };

      setBans(prev => [...prev, newBan]);
      
      // Update escalation for the user
      const offenseWeights: Record<BanReason, number> = {
        harassment: 2, spam: 1, inappropriate_content: 2,
        scam: 3, underage: 5, payment_fraud: 3, other: 1
      };
      updateUserEscalation(cleanUsername, reason, offenseWeights[reason]);
      
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
        { banId, escalationLevel: recommendation.level, reasoning: recommendation.reasoning }
      );
      
      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    } finally {
      // Always release lock
      localStorage.removeItem(lockKey);
    }
  };

  // Enhanced unban function
  const unbanUser = (username: string, adminUsername: string = 'system', reason?: string): boolean => {
    try {
      const cleanUsername = sanitizeString(username);
      const cleanAdminUsername = sanitizeString(adminUsername);
      const cleanReason = reason ? sanitizeString(reason) : undefined;
      
      setBans(prev => prev.map(ban => {
        if (ban.username === cleanUsername && ban.active) {
          // Clear any active timer
          clearExpirationTimer(ban.id);
          
          return { ...ban, active: false };
        }
        return ban;
      }));
      
      addBanHistory('unbanned', cleanUsername, cleanReason || 'Ban lifted by admin', cleanAdminUsername);
      return true;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    }
  };

  // Enhanced appeal submission with evidence
  const submitAppeal = async (username: string, appealText: string, evidence?: File[]): Promise<boolean> => {
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
  };

  // Enhanced appeal review system
  const reviewAppeal = (banId: string, decision: 'approve' | 'reject' | 'escalate', reviewNotes: string, adminUsername: string): boolean => {
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
  };

  // Approve appeal
  const approveAppeal = (banId: string, adminUsername: string): boolean => {
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
  };

  // Reject appeal
  const rejectAppeal = (banId: string, adminUsername: string, reason?: string): boolean => {
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
  };

  // Escalate appeal
  const escalateAppeal = (banId: string, adminUsername: string, escalationReason: string): boolean => {
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
  };

  // Reset user escalation (admin only)
  const resetUserEscalation = (username: string, adminUsername: string): boolean => {
    try {
      const cleanUsername = sanitizeString(username);
      const cleanAdminUsername = sanitizeString(adminUsername);
      
      setEscalations(prev => prev.filter(e => e.username !== cleanUsername));
      
      addBanHistory(
        'unbanned', // Using existing enum value
        cleanUsername, 
        'Escalation level reset by admin', 
        cleanAdminUsername,
        { action: 'escalation_reset' }
      );
      
      return true;
    } catch (error) {
      console.error('Error resetting escalation:', error);
      return false;
    }
  };

  // IP ban functionality
  const banUserIP = (username: string, ipAddress: string, reason: string): boolean => {
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
  };

  // Check if IP is banned
  const isIPBanned = (ipAddress: string): boolean => {
    const now = new Date();
    return ipBans.some(ban => 
      ban.ipAddress === ipAddress && 
      (!ban.expiryDate || new Date(ban.expiryDate) > now)
    );
  };

  // Check if user is banned (with real-time expiration check)
  const isUserBanned = (username: string): UserBan | null => {
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
  };

  // Get ban info (same as isUserBanned but clearer name)
  const getBanInfo = (username: string): UserBan | null => {
    return isUserBanned(username);
  };

  // Get active bans
  const getActiveBans = (): UserBan[] => {
    return bans.filter(ban => ban.active).map(ban => {
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
  };

  // Get expired bans
  const getExpiredBans = (): UserBan[] => {
    return bans.filter(ban => !ban.active);
  };

  // Get user's ban history
  const getUserBanHistory = (username: string): UserBan[] => {
    return bans.filter(ban => ban.username === username);
  };

  // Update expired bans
  const updateExpiredBans = () => {
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
  };

  // Get comprehensive ban statistics
  const getBanStats = () => {
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
    
    // Escalation statistics
    const escalationStats = {
      level1: escalations.filter(e => e.escalationLevel === 1).length,
      level2: escalations.filter(e => e.escalationLevel === 2).length,
      level3: escalations.filter(e => e.escalationLevel === 3).length,
      level4: escalations.filter(e => e.escalationLevel === 4).length,
      level5: escalations.filter(e => e.escalationLevel === 5).length
    };
    
    return {
      totalActiveBans: activeBans.length,
      temporaryBans: activeBans.filter(ban => ban.banType === 'temporary').length,
      permanentBans: activeBans.filter(ban => ban.banType === 'permanent').length,
      pendingAppeals: activeBans.filter(ban => ban.appealSubmitted && ban.appealStatus === 'pending').length,
      recentBans24h: bans.filter(ban => new Date(ban.startTime) >= twentyFourHoursAgo).length,
      bansByReason,
      appealStats,
      escalationStats
    };
  };

  return (
    <BanContext.Provider value={{
      bans,
      banHistory,
      escalations,
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
      getRecommendedBanDuration,
      getUserEscalation,
      resetUserEscalation,
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
