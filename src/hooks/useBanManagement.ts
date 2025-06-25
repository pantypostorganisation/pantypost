import { useState, useEffect } from 'react';
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
    getBanStats = () => null, 
    unbanUser = () => false, 
    reviewAppeal = () => false,
    banHistory = [],
    updateExpiredBans = () => {}
  } = banContext || {};

  const [selectedBan, setSelectedBan] = useState<BanEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedBans, setExpandedBans] = useState<Set<string>>(new Set());
  const [appealReviewNotes, setAppealReviewNotes] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);

  useEffect(() => {
    if (updateExpiredBans) {
      const interval = setInterval(updateExpiredBans, 60000);
      return () => clearInterval(interval);
    }
    return; // Add explicit return for else case
  }, [updateExpiredBans]);

  return {
    user,
    banContext,
    getActiveBans,
    getExpiredBans,
    getBanStats,
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
    setEvidenceIndex
  };
};
