// src/context/BanContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type BanType = 'temporary' | 'permanent';
export type BanReason = 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'underage' | 'payment_fraud' | 'other';

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
  notes?: string; // admin notes
  reportIds?: string[]; // linked report IDs that led to this ban
};

export type BanHistory = {
  id: string;
  username: string;
  action: 'banned' | 'unbanned' | 'appeal_submitted' | 'appeal_approved' | 'appeal_rejected';
  details: string;
  timestamp: string;
  adminUsername: string;
};

type BanContextType = {
  bans: UserBan[];
  banHistory: BanHistory[];
  // Ban management
  banUser: (username: string, hours: number | 'permanent', reason: BanReason, customReason?: string, adminUsername?: string, reportIds?: string[], notes?: string) => boolean;
  unbanUser: (username: string, adminUsername?: string, reason?: string) => boolean;
  isUserBanned: (username: string) => UserBan | null;
  getBanInfo: (username: string) => UserBan | null;
  // Ban queries
  getActiveBans: () => UserBan[];
  getExpiredBans: () => UserBan[];
  getUserBanHistory: (username: string) => UserBan[];
  // Appeals
  submitAppeal: (username: string, appealText: string) => boolean;
  approveAppeal: (banId: string, adminUsername: string) => boolean;
  rejectAppeal: (banId: string, adminUsername: string, reason?: string) => boolean;
  // Utilities
  updateExpiredBans: () => void;
  getBanStats: () => {
    totalActiveBans: number;
    temporaryBans: number;
    permanentBans: number;
    pendingAppeals: number;
    recentBans24h: number;
  };
};

const BanContext = createContext<BanContextType | undefined>(undefined);

export const BanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bans, setBans] = useState<UserBan[]>([]);
  const [banHistory, setBanHistory] = useState<BanHistory[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBans = localStorage.getItem('panty_user_bans');
      const storedHistory = localStorage.getItem('panty_ban_history');
      
      if (storedBans) {
        const parsedBans = JSON.parse(storedBans);
        setBans(parsedBans);
      }
      
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        setBanHistory(parsedHistory);
      }
    }
  }, []);

  // Save bans to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_user_bans', JSON.stringify(bans));
    }
  }, [bans]);

  // Save ban history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('panty_ban_history', JSON.stringify(banHistory));
    }
  }, [banHistory]);

  // Update expired bans every minute
  useEffect(() => {
    updateExpiredBans();
    const interval = setInterval(updateExpiredBans, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Add to ban history
  const addBanHistory = (action: BanHistory['action'], username: string, details: string, adminUsername: string) => {
    const historyEntry: BanHistory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      username,
      action,
      details,
      timestamp: new Date().toISOString(),
      adminUsername
    };
    setBanHistory(prev => [...prev, historyEntry]);
  };

  // Ban a user
  const banUser = (
    username: string, 
    hours: number | 'permanent', 
    reason: BanReason, 
    customReason?: string, 
    adminUsername: string = 'system',
    reportIds?: string[],
    notes?: string
  ): boolean => {
    try {
      // Check if user is already banned
      const existingBan = bans.find(ban => ban.username === username && ban.active);
      if (existingBan) {
        return false; // User already banned
      }

      const now = new Date();
      const banId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const newBan: UserBan = {
        id: banId,
        username,
        banType: hours === 'permanent' ? 'permanent' : 'temporary',
        reason,
        customReason,
        startTime: now.toISOString(),
        endTime: hours === 'permanent' ? undefined : new Date(now.getTime() + (hours as number) * 60 * 60 * 1000).toISOString(),
        remainingHours: hours === 'permanent' ? undefined : hours as number,
        bannedBy: adminUsername,
        active: true,
        appealable: true,
        notes,
        reportIds: reportIds || []
      };

      setBans(prev => [...prev, newBan]);
      
      // Add to history
      const durationText = hours === 'permanent' ? 'permanently' : `for ${hours} hours`;
      addBanHistory('banned', username, `Banned ${durationText} for ${reason}${customReason ? `: ${customReason}` : ''}`, adminUsername);
      
      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  };

  // Unban a user
  const unbanUser = (username: string, adminUsername: string = 'system', reason?: string): boolean => {
    try {
      setBans(prev => prev.map(ban => 
        ban.username === username && ban.active 
          ? { ...ban, active: false } 
          : ban
      ));
      
      addBanHistory('unbanned', username, reason || 'Ban lifted by admin', adminUsername);
      return true;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    }
  };

  // Check if user is banned
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

  // Submit appeal
  const submitAppeal = (username: string, appealText: string): boolean => {
    try {
      setBans(prev => prev.map(ban => 
        ban.username === username && ban.active && ban.appealable
          ? { 
              ...ban, 
              appealSubmitted: true, 
              appealText, 
              appealDate: new Date().toISOString() 
            }
          : ban
      ));
      
      addBanHistory('appeal_submitted', username, `Appeal submitted: "${appealText.substring(0, 100)}${appealText.length > 100 ? '...' : ''}"`, username);
      return true;
    } catch (error) {
      console.error('Error submitting appeal:', error);
      return false;
    }
  };

  // Approve appeal
  const approveAppeal = (banId: string, adminUsername: string): boolean => {
    try {
      const ban = bans.find(b => b.id === banId);
      if (!ban) return false;
      
      setBans(prev => prev.map(b => 
        b.id === banId ? { ...b, active: false } : b
      ));
      
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
          ? { ...b, appealSubmitted: false, appealText: undefined, appealable: false }
          : b
      ));
      
      addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
      return true;
    } catch (error) {
      console.error('Error rejecting appeal:', error);
      return false;
    }
  };

  // Update expired bans
  const updateExpiredBans = () => {
    const now = new Date();
    setBans(prev => prev.map(ban => {
      if (ban.active && ban.banType === 'temporary' && ban.endTime) {
        const endTime = new Date(ban.endTime);
        if (now >= endTime) {
          addBanHistory('unbanned', ban.username, 'Temporary ban expired automatically', 'system');
          return { ...ban, active: false };
        }
      }
      return ban;
    }));
  };

  // Get ban statistics
  const getBanStats = () => {
    const activeBans = getActiveBans();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      totalActiveBans: activeBans.length,
      temporaryBans: activeBans.filter(ban => ban.banType === 'temporary').length,
      permanentBans: activeBans.filter(ban => ban.banType === 'permanent').length,
      pendingAppeals: activeBans.filter(ban => ban.appealSubmitted).length,
      recentBans24h: bans.filter(ban => 
        new Date(ban.startTime) >= twentyFourHoursAgo
      ).length
    };
  };

  return (
    <BanContext.Provider value={{
      bans,
      banHistory,
      banUser,
      unbanUser,
      isUserBanned,
      getBanInfo,
      getActiveBans,
      getExpiredBans,
      getUserBanHistory,
      submitAppeal,
      approveAppeal,
      rejectAppeal,
      updateExpiredBans,
      getBanStats
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