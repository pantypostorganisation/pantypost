// src/hooks/useBanManagement.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBans } from '@/context/BanContext';
import { useAuth } from '@/context/AuthContext';
import { BanEntry, BanStats, FilterOptions } from '@/types/ban';

export const useBanManagement = () => {
  const { user } = useAuth();
  
  let banContext;
  try {
    banContext = useBans();
  } catch (error) {
    console.error('BanContext error:', error);
    banContext = null;
  }
  
  const { 
    getActiveBans = () => [], 
    getExpiredBans = () => [], 
    getBanStats = () => ({
      totalActiveBans: 0,
      temporaryBans: 0,
      permanentBans: 0,
      pendingAppeals: 0,
      recentBans24h: 0,
      bansByReason: {
        harassment: 0,
        spam: 0,
        inappropriate_content: 0,
        scam: 0,
        underage: 0,
        payment_fraud: 0,
        other: 0
      },
      appealStats: {
        totalAppeals: 0,
        pendingAppeals: 0,
        approvedAppeals: 0,
        rejectedAppeals: 0
      }
    }), 
    unbanUser = () => false, 
    reviewAppeal = () => false,
    banHistory = [],
    updateExpiredBans = () => {},
    refreshBanData = async () => {}
  } = banContext || {};

  const [selectedBan, setSelectedBan] = useState<BanEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedBans, setExpandedBans] = useState<Set<string>>(new Set());
  const [appealReviewNotes, setAppealReviewNotes] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  // Auto-update expired bans every minute
  useEffect(() => {
    if (updateExpiredBans) {
      // Update immediately on mount
      updateExpiredBans();
      
      // Then update every minute
      const interval = setInterval(() => {
        console.log('[useBanManagement] Auto-updating expired bans');
        updateExpiredBans();
      }, 60000);
      
      return () => clearInterval(interval);
    }
    // Return undefined for the case where updateExpiredBans is falsy
    return undefined;
  }, [updateExpiredBans]);

  // Listen for ban expiration events
  useEffect(() => {
    const handleBanExpired = (event: CustomEvent) => {
      console.log('[useBanManagement] Ban expired event:', event.detail);
      // Force refresh when a ban expires
      if (refreshBanData) {
        refreshBanData();
      }
    };

    window.addEventListener('banExpired', handleBanExpired as EventListener);
    return () => {
      window.removeEventListener('banExpired', handleBanExpired as EventListener);
    };
  }, [refreshBanData]);

  // Memoize the function calls to prevent re-renders
  const memoizedGetActiveBans = useCallback(() => {
    if (!banContext) return [];
    return getActiveBans();
  }, [banContext, getActiveBans]);

  const memoizedGetExpiredBans = useCallback(() => {
    if (!banContext) return [];
    return getExpiredBans();
  }, [banContext, getExpiredBans]);

  const memoizedGetBanStats = useCallback(() => {
    if (!banContext) {
      return {
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {
          harassment: 0,
          spam: 0,
          inappropriate_content: 0,
          scam: 0,
          underage: 0,
          payment_fraud: 0,
          other: 0
        },
        appealStats: {
          totalAppeals: 0,
          pendingAppeals: 0,
          approvedAppeals: 0,
          rejectedAppeals: 0
        }
      };
    }
    return getBanStats();
  }, [banContext, getBanStats]);

  return {
    user,
    banContext,
    getActiveBans: memoizedGetActiveBans,
    getExpiredBans: memoizedGetExpiredBans,
    getBanStats: memoizedGetBanStats,
    unbanUser,
    reviewAppeal,
    banHistory,
    selectedBan,
    setSelectedBan,
    isLoading,
    setIsLoading,
    expandedBans,
    setExpandedBans,
    appealReviewNotes,
    setAppealReviewNotes,
    selectedEvidence,
    setSelectedEvidence,
    evidenceIndex,
    setEvidenceIndex,
    refreshBanData
  };
};
