// src/app/admin/bans/page.tsx
'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { Shield, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { FilterOptions, BanStats } from '@/types/ban';
import { banService } from '@/services/ban.service';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  BanListSkeleton,
  AdminStatsSkeleton
} from '@/components/skeletons/AdminSkeletons';

// Lazy load heavy components
const BanStatsDashboard = lazy(() => import('@/components/admin/bans/BanStatsDashboard'));
const BanTabs = lazy(() => import('@/components/admin/bans/BanTabs'));
const BanFilters = lazy(() => import('@/components/admin/bans/BanFilters'));
const UnbanModal = lazy(() => import('@/components/admin/bans/UnbanModal'));
const AppealReviewModal = lazy(() => import('@/components/admin/bans/AppealReviewModal'));
const EvidenceModal = lazy(() => import('@/components/admin/bans/EvidenceModal'));
const ActiveBansContent = lazy(() => import('@/components/admin/bans/ActiveBansContent'));
const ExpiredBansContent = lazy(() => import('@/components/admin/bans/ExpiredBansContent'));
const AppealsContent = lazy(() => import('@/components/admin/bans/AppealsContent'));
const HistoryContent = lazy(() => import('@/components/admin/bans/HistoryContent'));
const AnalyticsContent = lazy(() => import('@/components/admin/bans/AnalyticsContent'));

type TabKey = 'active' | 'expired' | 'appeals' | 'history' | 'analytics';

export default function BanManagementPage() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    filterBy: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Ban data from MongoDB
  const [activeBans, setActiveBans] = useState<any[]>([]);
  const [expiredBans, setExpiredBans] = useState<any[]>([]);
  const [banHistory, setBanHistory] = useState<any[]>([]);
  const [banStats, setBanStats] = useState<BanStats>({
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
  });
  
  const [selectedBan, setSelectedBan] = useState<any>(null);
  const [expandedBans, setExpandedBans] = useState<Set<string>>(new Set());
  const [appealReviewNotes, setAppealReviewNotes] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidenceIndex, setEvidenceIndex] = useState(0);
  
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch bans from MongoDB
  const fetchBans = async () => {
    setIsLoading(true);
    try {
      // Fetch active bans
      const activeBansResponse = await banService.getBans({ active: true });
      if (activeBansResponse.success && activeBansResponse.data) {
        // Safely access the data with type checking
        const responseData = activeBansResponse.data as any;
        const bansArray = responseData.bans || [];
        
        const transformedActiveBans = bansArray.map((ban: any) => ({
          id: ban._id,
          username: ban.username,
          bannedBy: ban.bannedBy,
          reason: ban.reason,
          customReason: ban.customReason,
          banType: ban.isPermanent ? 'permanent' : 'temporary',
          duration: ban.duration,
          notes: ban.notes,
          startTime: ban.createdAt,
          endTime: ban.expiresAt,
          remainingHours: ban.duration && !ban.isPermanent ? 
            Math.max(0, (new Date(ban.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : 0,
          appealSubmitted: ban.appealSubmitted,
          appealText: ban.appealText,
          appealDate: ban.appealDate,
          appealStatus: ban.appealStatus,
          appealEvidence: []
        }));
        setActiveBans(transformedActiveBans);
      }

      // Fetch expired bans
      const expiredBansResponse = await banService.getBans({ active: false });
      if (expiredBansResponse.success && expiredBansResponse.data) {
        const responseData = expiredBansResponse.data as any;
        setExpiredBans(responseData.bans || []);
      }

      // Fetch ban stats
      const statsResponse = await banService.getBanStats();
      if (statsResponse.success && statsResponse.data) {
        // Transform the data to match BanStats type
        const statsData = statsResponse.data as any;
        setBanStats({
          totalActiveBans: statsData.totalActiveBans || 0,
          temporaryBans: statsData.temporaryBans || 0,
          permanentBans: statsData.permanentBans || 0,
          pendingAppeals: statsData.pendingAppeals || 0,
          recentBans24h: statsData.bansLast24h || 0,
          bansByReason: statsData.bansByReason || {
            harassment: 0,
            spam: 0,
            inappropriate_content: 0,
            scam: 0,
            underage: 0,
            payment_fraud: 0,
            other: 0
          },
          appealStats: statsData.appealStats || {
            totalAppeals: 0,
            pendingAppeals: 0,
            approvedAppeals: 0,
            rejectedAppeals: 0
          }
        });
      }

      // Build history from all bans
      const allBans = [
        ...(activeBansResponse.data && (activeBansResponse.data as any).bans ? (activeBansResponse.data as any).bans : []),
        ...(expiredBansResponse.data && (expiredBansResponse.data as any).bans ? (expiredBansResponse.data as any).bans : [])
      ];
      const history = allBans.map((ban: any) => ({
        id: ban._id,
        username: ban.username,
        action: ban.active ? 'banned' : 'unbanned',
        details: `${ban.reason}${ban.customReason ? ': ' + ban.customReason : ''}`,
        adminUsername: ban.bannedBy,
        timestamp: ban.createdAt
      }));
      setBanHistory(history);

    } catch (error) {
      console.error('Error fetching bans:', error);
      showError('Failed to load ban data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBans();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBans();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleUnban = (ban: any) => {
    setSelectedBan(ban);
    setShowUnbanModal(true);
  };

  const confirmUnban = async (reason: string) => {
    if (!selectedBan) return;

    setIsLoading(true);
    try {
      const result = await banService.unbanUser(selectedBan.username, reason);
      if (result.success) {
        showSuccess(`Successfully unbanned ${selectedBan.username}`);
        setShowUnbanModal(false);
        setSelectedBan(null);
        await fetchBans();
      } else {
        showError(result.error?.message || 'Failed to unban user');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      showError('Failed to unban user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppealReview = (ban: any) => {
    setSelectedBan(ban);
    setShowAppealModal(true);
    setAppealReviewNotes('');
  };

  const confirmAppealDecision = async (decision: 'approve' | 'reject' | 'escalate') => {
    if (!selectedBan || !appealReviewNotes.trim()) {
      showError('Please provide review notes');
      return;
    }

    setIsLoading(true);
    try {
      const result = await banService.reviewAppeal(selectedBan.id, decision, appealReviewNotes);
      if (result.success) {
        showSuccess(`Appeal ${decision}d successfully`);
        setShowAppealModal(false);
        setSelectedBan(null);
        setAppealReviewNotes('');
        await fetchBans();
      } else {
        showError(result.error?.message || 'Failed to process appeal');
      }
    } catch (error) {
      console.error('Error processing appeal:', error);
      showError('Failed to process appeal');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBanExpansion = (banId: string) => {
    setExpandedBans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(banId)) {
        newSet.delete(banId);
      } else {
        newSet.add(banId);
      }
      return newSet;
    });
  };

  const showEvidence = (evidence: string[]) => {
    setSelectedEvidence(evidence);
    setEvidenceIndex(0);
    setShowEvidenceModal(true);
  };

  const exportBanData = () => {
    try {
      const exportData = {
        activeBans,
        expiredBans,
        banHistory,
        banStats,
        exportDate: new Date().toISOString(),
        exportedBy: user?.username || 'admin'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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

      showSuccess('Ban data exported successfully');
    } catch (error) {
      console.error('Error exporting ban data:', error);
      showError('Failed to export ban data');
    }
  };

  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const pendingAppeals = activeBans.filter(
    ban => ban.appealSubmitted && ban.appealStatus === 'pending'
  );

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center gap-3 text-3xl font-semibold text-white">
                <span className="rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 p-1.5 text-[#ff950e]">
                  <Shield size={24} />
                </span>
                Ban Management
              </h1>
              <p className="text-sm text-zinc-400">Manage user bans and appeals</p>
            </div>

            <div className="flex w-full flex-col items-start gap-3 text-sm sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={exportBanData}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500 px-4 py-2 font-medium text-black transition-colors hover:bg-blue-400"
              >
                <Download size={16} />
                Export Data
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#ff950e]/60 bg-[#ff950e] px-4 py-2 font-medium text-black transition-colors hover:bg-[#e88800] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {isLoading ? (
            <>
              <AdminStatsSkeleton />
              <BanListSkeleton count={5} />
            </>
          ) : (
            <>
              <Suspense fallback={<AdminStatsSkeleton />}>
                <BanStatsDashboard banStats={banStats} />
              </Suspense>

              <Suspense fallback={<div className="h-12 bg-gray-800 rounded mb-4 animate-pulse" />}>
                <BanTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  banStats={banStats}
                  expiredCount={expiredBans.length}
                  historyCount={banHistory.length}
                />
              </Suspense>

              <Suspense fallback={<div className="h-12 bg-gray-800 rounded mb-4 animate-pulse" />}>
                <BanFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  showTypeFilter={['active', 'expired'].includes(activeTab)}
                  isVisible={['active', 'expired', 'appeals'].includes(activeTab)}
                />
              </Suspense>

              <Suspense fallback={<BanListSkeleton count={5} />}>
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
                  <ExpiredBansContent expiredBans={expiredBans} filters={filters} />
                )}

                {activeTab === 'appeals' && (
                  <AppealsContent
                    pendingAppeals={pendingAppeals}
                    onReviewAppeal={handleAppealReview}
                    onShowEvidence={showEvidence}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryContent banHistory={banHistory} filters={filters} />
                )}

                {activeTab === 'analytics' && <AnalyticsContent banStats={banStats} />}
              </Suspense>

              {showUnbanModal && (
                <Suspense fallback={null}>
                  <UnbanModal
                    ban={selectedBan}
                    isLoading={isLoading}
                    onClose={() => {
                      setShowUnbanModal(false);
                      setSelectedBan(null);
                    }}
                    onConfirm={confirmUnban}
                  />
                </Suspense>
              )}

              {showAppealModal && (
                <Suspense fallback={null}>
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
                </Suspense>
              )}

              {showEvidenceModal && (
                <Suspense fallback={null}>
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
                </Suspense>
              )}
            </>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
