// src/app/admin/bans/page.tsx
'use client';

import { useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanStatsDashboard from '@/components/admin/bans/BanStatsDashboard';
import BanTabs from '@/components/admin/bans/BanTabs';
import BanFilters from '@/components/admin/bans/BanFilters';
import UnbanModal from '@/components/admin/bans/UnbanModal';
import AppealReviewModal from '@/components/admin/bans/AppealReviewModal';
import EvidenceModal from '@/components/admin/bans/EvidenceModal';
import ActiveBansContent from '@/components/admin/bans/ActiveBansContent';
import ExpiredBansContent from '@/components/admin/bans/ExpiredBansContent';
import AppealsContent from '@/components/admin/bans/AppealsContent';
import HistoryContent from '@/components/admin/bans/HistoryContent';
import AnalyticsContent from '@/components/admin/bans/AnalyticsContent';
import { Shield, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { FilterOptions, BanStats } from '@/types/ban';
import { UserBan } from '@/context/BanContext';
import { useBanManagement } from '@/hooks/useBanManagement';
import { isValidBan } from '@/utils/banUtils';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

type TabKey = 'active' | 'expired' | 'appeals' | 'history' | 'analytics';

export default function BanManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    filterBy: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
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
    toggleBanExpansion,
    appealReviewNotes,
    setAppealReviewNotes,
    selectedEvidence,
    setSelectedEvidence,
    evidenceIndex,
    setEvidenceIndex,
    refreshBanData,
    rateLimitError
  } = useBanManagement();

  // Force refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshBanData) {
        await refreshBanData();
      } else {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Safe data retrieval
  const banStats: BanStats = (() => {
    try {
      const stats = getBanStats();
      return stats || {
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
    } catch (error) {
      console.error('Error getting ban stats:', error);
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
  })();

  const activeBans = (() => {
    try {
      const bans = getActiveBans() || [];
      console.log('[BanManagementPage] Active bans:', bans.length);
      return bans;
    } catch (error) {
      console.error('Error getting active bans:', error);
      return [];
    }
  })();

  const expiredBans = (() => {
    try {
      return getExpiredBans() || [];
    } catch (error) {
      console.error('Error getting expired bans:', error);
      return [];
    }
  })();

  const pendingAppeals = activeBans.filter(ban => 
    ban && 
    ban.appealSubmitted && 
    ban.appealStatus === 'pending'
  );

  const handleUnban = (ban: UserBan) => {
    if (!isValidBan(ban)) {
      alert('Invalid ban data - missing username');
      return;
    }
    setSelectedBan(ban);
    setShowUnbanModal(true);
  };

  const confirmUnban = async (reason: string) => {
    if (!selectedBan || !selectedBan.username) {
      alert('No ban selected or invalid ban data');
      return;
    }
    
    // Show rate limit error if exists
    if (rateLimitError) {
      alert(rateLimitError);
      return;
    }
    
    // Sanitize the reason
    const sanitizedReason = sanitizeStrict(reason || 'Manually unbanned by admin');
    
    setIsLoading(true);
    try {
      if (typeof unbanUser !== 'function') {
        alert('Unban function not available');
        return;
      }
      // Using the secure unban function from the hook
      const success = await unbanUser(
        selectedBan.username, 
        user?.username || 'admin', 
        sanitizedReason
      );
      if (success) {
        alert(`Successfully unbanned ${sanitizeStrict(selectedBan.username)}`);
        setShowUnbanModal(false);
        setSelectedBan(null);
        // Refresh data after unban
        handleRefresh();
      } else {
        alert('Failed to unban user - they may not be banned or an error occurred');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('An error occurred while unbanning the user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppealReview = (ban: UserBan) => {
    if (!isValidBan(ban)) {
      alert('Invalid ban data for appeal review');
      return;
    }
    if (!ban.appealSubmitted) {
      alert('No appeal has been submitted for this ban');
      return;
    }
    setSelectedBan(ban);
    setShowAppealModal(true);
    setAppealReviewNotes('');
  };

  const confirmAppealDecision = async (decision: 'approve' | 'reject' | 'escalate') => {
    if (!selectedBan || !selectedBan.id) {
      alert('No ban selected for appeal review');
      return;
    }
    
    if (!appealReviewNotes.trim()) {
      alert('Please provide review notes explaining your decision');
      return;
    }
    
    // Show rate limit error if exists
    if (rateLimitError) {
      alert(rateLimitError);
      return;
    }
    
    // Sanitize the review notes
    const sanitizedNotes = sanitizeStrict(appealReviewNotes.trim());
    
    setIsLoading(true);
    try {
      if (typeof reviewAppeal !== 'function') {
        alert('Review appeal function not available');
        return;
      }
      // Using the secure review appeal function from the hook
      const success = await reviewAppeal(
        selectedBan.id, 
        decision, 
        sanitizedNotes, 
        user?.username || 'admin'
      );
      if (success) {
        alert(`Appeal ${decision}d successfully`);
        setShowAppealModal(false);
        setSelectedBan(null);
        setAppealReviewNotes('');
        // Refresh data after appeal decision
        handleRefresh();
      } else {
        alert('Failed to process appeal - please try again');
      }
    } catch (error) {
      console.error('Error processing appeal:', error);
      alert('An error occurred while processing the appeal');
    } finally {
      setIsLoading(false);
    }
  };

  const showEvidence = (evidence: string[]) => {
    if (!evidence || !Array.isArray(evidence)) {
      alert('No evidence available for this appeal');
      return;
    }
    
    const validEvidence = evidence.filter(item => 
      typeof item === 'string' && item.length > 0
    );
    
    if (validEvidence.length === 0) {
      alert('No valid evidence files found');
      return;
    }
    
    setSelectedEvidence(validEvidence);
    setEvidenceIndex(0);
    setShowEvidenceModal(true);
  };

  const exportBanData = () => {
    try {
      // Sanitize data before export
      const sanitizedData = {
        activeBans: activeBans.map(ban => sanitizeObject(ban, {
          maxDepth: 3,
          keySanitizer: (key) => sanitizeStrict(key),
          valueSanitizer: (value) => {
            if (typeof value === 'string') {
              return sanitizeStrict(value);
            }
            return value;
          }
        })) || [],
        expiredBans: expiredBans.map(ban => sanitizeObject(ban, {
          maxDepth: 3,
          keySanitizer: (key) => sanitizeStrict(key),
          valueSanitizer: (value) => {
            if (typeof value === 'string') {
              return sanitizeStrict(value);
            }
            return value;
          }
        })) || [],
        banHistory: (banHistory || []).map(entry => sanitizeObject(entry, {
          maxDepth: 3,
          keySanitizer: (key) => sanitizeStrict(key),
          valueSanitizer: (value) => {
            if (typeof value === 'string') {
              return sanitizeStrict(value);
            }
            return value;
          }
        })),
        banStats: sanitizeObject(banStats || {}, {
          maxDepth: 3,
          keySanitizer: (key) => sanitizeStrict(key),
          valueSanitizer: (value) => value
        }),
        exportDate: new Date().toISOString(),
        version: '1.0',
        exportedBy: sanitizeStrict(user?.username || 'admin'),
        totalRecords: (activeBans?.length || 0) + (expiredBans?.length || 0)
      };
      
      const blob = new Blob([JSON.stringify(sanitizedData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ban-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Ban data exported successfully');
    } catch (error) {
      console.error('Error exporting ban data:', error);
      alert('Failed to export ban data - please try again');
    }
  };

  // Update filters with sanitization
  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    const sanitizedFilters = { ...newFilters };
    
    // Sanitize search term if it exists
    if ('searchTerm' in sanitizedFilters && sanitizedFilters.searchTerm) {
      sanitizedFilters.searchTerm = securityService.sanitizeSearchQuery(sanitizedFilters.searchTerm);
    }
    
    setFilters(prev => ({ ...prev, ...sanitizedFilters }));
  };

  if (!banContext) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black text-white">
          <main className="p-8 max-w-7xl mx-auto">
            <div className="bg-[#1a1a1a] border border-red-800 rounded-lg p-8 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-red-400 mb-2">Ban System Unavailable</h2>
              <p className="text-gray-400">
                The ban management system is currently unavailable. Please refresh the page or contact support.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800]"
              >
                Refresh Page
              </button>
            </div>
          </main>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-black text-white">
        <main className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#ff950e] flex items-center">
                <Shield className="mr-3" />
                Ban Management
              </h1>
              <p className="text-gray-400 mt-1">
                Manual ban oversight and appeal processing
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exportBanData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                Export Data
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Show rate limit error if exists */}
          {rateLimitError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{rateLimitError}</p>
            </div>
          )}

          <BanStatsDashboard banStats={banStats} />
          
          <BanTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            banStats={banStats}
            expiredCount={expiredBans.length}
            historyCount={banHistory.length}
          />

          <BanFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            showTypeFilter={['active', 'expired'].includes(activeTab)}
            isVisible={['active', 'expired', 'appeals'].includes(activeTab)}
          />

          {/* Tab Content - Now just clean component calls */}
          {activeTab === 'active' && (
            <ActiveBansContent
              activeBans={activeBans}
              filters={filters}
              totalCount={banStats.totalActiveBans}
              expandedBans={expandedBans}
              onToggleExpand={toggleBanExpansion}
              onUnban={handleUnban}
              onReviewAppeal={handleAppealReview}
              onShowEvidence={showEvidence}
            />
          )}

          {activeTab === 'expired' && (
            <ExpiredBansContent
              expiredBans={expiredBans}
              filters={filters}
            />
          )}

          {activeTab === 'appeals' && (
            <AppealsContent
              pendingAppeals={pendingAppeals}
              onReviewAppeal={handleAppealReview}
              onShowEvidence={showEvidence}
            />
          )}

          {activeTab === 'history' && (
            <HistoryContent
              banHistory={banHistory}
              filters={filters}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsContent banStats={banStats} />
          )}

          {/* Modals */}
          {showUnbanModal && (
            <UnbanModal
              ban={selectedBan}
              isLoading={isLoading}
              onClose={() => {
                setShowUnbanModal(false);
                setSelectedBan(null);
              }}
              onConfirm={confirmUnban}
            />
          )}

          {showAppealModal && (
            <AppealReviewModal
              ban={selectedBan}
              appealReviewNotes={appealReviewNotes}
              setAppealReviewNotes={setAppealReviewNotes}
              isLoading={isLoading}
              onClose={() => {
                setShowAppealModal(false);
                setSelectedBan(null);
                setAppealReviewNotes('');
              }}
              onConfirm={confirmAppealDecision}
              onShowEvidence={showEvidence}
            />
          )}

          {showEvidenceModal && (
            <EvidenceModal
              evidence={selectedEvidence}
              evidenceIndex={evidenceIndex}
              setEvidenceIndex={setEvidenceIndex}
              onClose={() => {
                setShowEvidenceModal(false);
                setSelectedEvidence([]);
                setEvidenceIndex(0);
              }}
            />
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
