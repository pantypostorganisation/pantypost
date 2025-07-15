// src/hooks/useBanManagement.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBans } from '@/context/BanContext';
import { useAuth } from '@/context/AuthContext';
import { BanEntry, BanStats, FilterOptions } from '@/types/ban';
import { sanitize } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export const useBanManagement = () => {
  const { user } = useAuth();
  const rateLimiter = getRateLimiter();
  
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
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

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

  // Secure unban handler with rate limiting
  const secureUnbanUser = useCallback(async (username: string, adminUsername: string, reason?: string): Promise<boolean> => {
    // Clear previous error
    setRateLimitError(null);

    // Check rate limit
    const rateLimitResult = rateLimiter.check('BAN_USER', RATE_LIMITS.BAN_USER);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many ban operations. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }

    // Sanitize inputs
    const sanitizedUsername = sanitize.username(username);
    const sanitizedAdminUsername = sanitize.username(adminUsername);
    const sanitizedReason = reason ? sanitize.strict(reason) : undefined;

    if (!sanitizedUsername) {
      console.error('Invalid username provided for unban');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await unbanUser(sanitizedUsername, sanitizedAdminUsername, sanitizedReason);
      return result;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [unbanUser, rateLimiter]);

  // Secure appeal review handler
  const secureReviewAppeal = useCallback(async (
    appealId: string,
    decision: 'approve' | 'reject' | 'escalate',
    adminNotes: string,
    adminUsername: string
  ): Promise<boolean> => {
    // Clear previous error
    setRateLimitError(null);

    // Check rate limit
    const rateLimitResult = rateLimiter.check('REPORT_ACTION', RATE_LIMITS.REPORT_ACTION);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many review operations. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }

    // Sanitize inputs
    const sanitizedNotes = sanitize.strict(adminNotes);
    const sanitizedAdminUsername = sanitize.username(adminUsername);

    if (!appealId || !sanitizedNotes) {
      console.error('Invalid parameters for appeal review');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await reviewAppeal(appealId, decision, sanitizedNotes, sanitizedAdminUsername);
      return result;
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [reviewAppeal, rateLimiter]);

  // Secure setter for appeal review notes
  const setAppealReviewNotesSafe = useCallback((notes: string) => {
    // Allow admins to write detailed notes, but still have a reasonable limit
    const MAX_NOTES_LENGTH = 2000;
    const truncated = notes.slice(0, MAX_NOTES_LENGTH);
    setAppealReviewNotes(truncated);
  }, []);

  // Secure evidence selection
  const setSelectedEvidenceSafe = useCallback((evidence: string[]) => {
    // Validate evidence URLs
    const validEvidence = evidence.filter(url => {
      const sanitized = sanitize.url(url);
      return sanitized && sanitized.length > 0;
    });
    setSelectedEvidence(validEvidence);
  }, []);

  // Toggle ban expansion with validation
  const toggleBanExpansion = useCallback((banId: string) => {
    setExpandedBans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(banId)) {
        newSet.delete(banId);
      } else {
        // Limit the number of expanded items for performance
        if (newSet.size >= 10) {
          // Remove the oldest one (first in the set)
          const firstKey = newSet.values().next().value;
          if (firstKey) {
            newSet.delete(firstKey);
          }
        }
        newSet.add(banId);
      }
      return newSet;
    });
  }, []);

  return {
    user,
    banContext,
    getActiveBans: memoizedGetActiveBans,
    getExpiredBans: memoizedGetExpiredBans,
    getBanStats: memoizedGetBanStats,
    unbanUser: secureUnbanUser,
    reviewAppeal: secureReviewAppeal,
    banHistory,
    selectedBan,
    setSelectedBan,
    isLoading,
    setIsLoading,
    expandedBans,
    setExpandedBans,
    toggleBanExpansion,
    appealReviewNotes,
    setAppealReviewNotes: setAppealReviewNotesSafe,
    selectedEvidence,
    setSelectedEvidence: setSelectedEvidenceSafe,
    evidenceIndex,
    setEvidenceIndex,
    refreshBanData,
    rateLimitError
  };
};
