'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useBans } from '@/context/BanContext';
import RequireAuth from '@/components/RequireAuth';
import { storageService } from '@/services';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import type { ReportLog, BanFormData, ReportStats, UserReportStats } from '@/components/admin/reports/types';
import {
  ReportListSkeleton,
  AdminStatsSkeleton
} from '@/components/skeletons/AdminSkeletons';

// Lazy load heavy components
const ReportsHeader = lazy(() => import('@/components/admin/reports/ReportsHeader'));
const ReportsStats = lazy(() => import('@/components/admin/reports/ReportsStats'));
const ReportsFilters = lazy(() => import('@/components/admin/reports/ReportsFilters'));
const ReportsList = lazy(() => import('@/components/admin/reports/ReportsList'));
const BanModal = lazy(() => import('@/components/admin/reports/BanModal'));
const ResolveModal = lazy(() => import('@/components/admin/reports/ResolveModal'));

// Loading skeleton for filters
function FiltersSkeletons() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Loading skeleton for modals
function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md">
        <div className="h-6 bg-gray-800 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ---- Mock data detection (conservative) ----
const isMockString = (val?: string) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  // Avoid over-aggressive removal; only common dev-demo patterns
  const patterns = [
    'spammer',       // e.g., spammer999
    'spam_bot',      // explicit mock
    'test',          // test, testuser, etc.
    'demo',          // demo accounts
    'sample',        // sample data
    'mock',          // mock entries
    'lorem', 'ipsum',
    'john_doe', 'jane_doe'
  ];
  // exact dev junk or clear substrings
  return patterns.some(p => v.includes(p));
};

const isMockReport = (r: ReportLog) => {
  return (
    isMockString(r.reporter) ||
    isMockString(r.reportee) ||
    isMockString(r.adminNotes) ||
    (r.category && isMockString(r.category)) ||
    (r.severity && isMockString(r.severity)) ||
    (r.id && (r.id.startsWith('mock_') || r.id.includes('sample') || r.id.includes('test')))
  );
};
// -------------------------------------------

export default function AdminReportsPage() {
  const { user } = useAuth();

  // Safely handle the ban context with try-catch
  let banContext: any = null;
  let banContextError: string | null = null;

  try {
    banContext = useBans();
  } catch (error) {
    console.error('Error initializing ban context:', error);
    banContextError = 'Ban management system not available';
    // Provide fallback methods to prevent crashes
    banContext = {
      banUser: () => Promise.resolve(false),
      getActiveBans: () => [],
      getBanStats: () => ({
        totalActiveBans: 0,
        temporaryBans: 0,
        permanentBans: 0,
        pendingAppeals: 0,
        recentBans24h: 0,
        bansByReason: {},
        appealStats: { totalAppeals: 0, pendingAppeals: 0, approvedAppeals: 0, rejectedAppeals: 0 }
      }),
      getBanInfo: () => null,
      validateBanInput: () => ({ valid: true })
    };
  }

  // State variables
  const [reports, setReports] = useState<ReportLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unprocessed' | 'processed'>('unprocessed');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportLog | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [showBanModal, setShowBanModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'reporter'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [banForm, setBanForm] = useState<BanFormData>({
    username: '',
    banType: 'temporary',
    hours: '24',
    reason: 'harassment',
    customReason: '',
    notes: ''
  });
  const [isProcessingBan, setIsProcessingBan] = useState(false);
  const [reportBanInfo, setReportBanInfo] = useState<{ [key: string]: any }>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [mockRemovalCount, setMockRemovalCount] = useState<number>(0);

  // Load reports (and cleanse mock data)
  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    setIsLoadingReports(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
        // Sanitize stored reports and normalize
        const enhancedReports = stored.map((report, index) => ({
          ...report,
          id: report.id || `report_${Date.now()}_${index}`,
          processed: report.processed || false,
          severity: report.severity || 'medium',
          category: report.category || 'other',
          // Sanitize text fields
          reporter: sanitizeStrict(report.reporter || ''),
          reportee: sanitizeStrict(report.reportee || ''),
          adminNotes: sanitizeStrict(report.adminNotes || ''),
          processedBy: report.processedBy ? sanitizeStrict(report.processedBy) : undefined
        }));

        // Remove any mock/dev data
        const cleansed = enhancedReports.filter(r => !isMockReport(r));
        const removedCount = enhancedReports.length - cleansed.length;

        // Sort newest → oldest
        cleansed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Persist the cleansed list if anything was removed
        if (removedCount > 0) {
          await storageService.setItem('panty_report_logs', cleansed);
          setMockRemovalCount(removedCount);
        } else {
          setMockRemovalCount(0);
        }

        setReports(cleansed);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error loading reports:', error);
        setReports([]);
      } finally {
        setIsLoadingReports(false);
      }
    }
  };

  // Calculate user report statistics
  const getUserReportStats = (username: string): UserReportStats => {
    const sanitizedUsername = sanitizeStrict(username);
    const userReports = reports.filter((report) => report.reportee === sanitizedUsername);
    const activeReports = userReports.filter((report) => !report.processed);
    const totalReports = userReports.length;

    // Get current ban status
    const banInfo =
      banContext && typeof banContext.getBanInfo === 'function'
        ? banContext.getBanInfo(sanitizedUsername)
        : null;

    return {
      totalReports,
      activeReports: activeReports.length,
      processedReports: totalReports - activeReports.length,
      isBanned: !!banInfo,
      banInfo,
      reportHistory: userReports.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    };
  };

  // Handle search term update with sanitization
  const handleSearchTermChange = (newSearchTerm: string) => {
    const sanitized = securityService.sanitizeSearchQuery(newSearchTerm);
    setSearchTerm(sanitized);
  };

  // Calculate filtered and sorted reports
  const filteredAndSortedReports = (() => {
    let filtered = reports.filter((report) => {
      if (!report) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm
        ? (report.reporter && report.reporter.toLowerCase().includes(searchLower)) ||
          (report.reportee && report.reportee.toLowerCase().includes(searchLower)) ||
          (report.adminNotes && report.adminNotes.toLowerCase().includes(searchLower))
        : true;

      const matchesFilter =
        filterBy === 'all' ? true : filterBy === 'processed' ? report.processed : !report.processed;

      const matchesSeverity = severityFilter === 'all' ? true : report.severity === severityFilter;

      const matchesCategory = categoryFilter === 'all' ? true : report.category === categoryFilter;

      return matchesSearch && matchesFilter && matchesSeverity && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'severity': {
          const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison =
            (severityOrder[a.severity || 'medium'] || 2) -
            (severityOrder[b.severity || 'medium'] || 2);
          break;
        }
        case 'reporter':
          comparison = (a.reporter || '').localeCompare(b.reporter || '');
          break;
        case 'date':
        default:
          comparison = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  })();

  // Update ban info
  useEffect(() => {
    if (!banContext || !filteredAndSortedReports.length) return;

    const updateBanInfo = () => {
      try {
        const newBanInfo: { [key: string]: any } = {};
        const uniqueReportees = [...new Set(filteredAndSortedReports.map((r) => r.reportee))];

        uniqueReportees.forEach((reportee) => {
          if (reportee && typeof banContext.getBanInfo === 'function') {
            try {
              const banInfo = banContext.getBanInfo(reportee);
              newBanInfo[reportee] = banInfo;
            } catch (error) {
              console.error(`Error getting ban info for ${sanitizeStrict(reportee)}:`, error);
              newBanInfo[reportee] = null;
            }
          }
        });

        setReportBanInfo(newBanInfo);
      } catch (error) {
        console.error('Error updating ban info:', error);
      }
    };

    const timeoutId = setTimeout(updateBanInfo, 100);
    return () => clearTimeout(timeoutId);
  }, [filteredAndSortedReports, banContext]);

  // Save reports with sanitization
  const saveReports = async (newReports: ReportLog[]) => {
    // Sanitize before saving
    const sanitizedReports = newReports.map((report) => ({
      ...report,
      reporter: sanitizeStrict(report.reporter || ''),
      reportee: sanitizeStrict(report.reportee || ''),
      adminNotes: sanitizeStrict(report.adminNotes || ''),
      processedBy: report.processedBy ? sanitizeStrict(report.processedBy) : undefined
    }))
    // Also ensure we never save mock entries
    .filter(r => !isMockReport(r));

    setReports(sanitizedReports);
    await storageService.setItem('panty_report_logs', sanitizedReports);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('updateReports'));
    }
  };

  // Toggle expanded state
  const toggleExpanded = (reportId: string) => {
    setExpandedReports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Handle manual ban with sanitization
  const handleManualBan = async () => {
    if (!banContext || typeof banContext.banUser !== 'function') {
      alert('Ban system not available');
      return;
    }

    setIsProcessingBan(true);

    try {
      const adminUsername = user?.username || 'admin';
      const reportIds = selectedReport ? [selectedReport.id!] : [];

      // Sanitize form inputs
      const sanitizedUsername = sanitizeStrict(banForm.username);
      const sanitizedNotes = sanitizeStrict(banForm.notes);
      const sanitizedCustomReason = sanitizeStrict(banForm.customReason);

      // Robust duration parsing
      const parsed = parseInt(String(banForm.hours), 10);
      const duration =
        banForm.banType === 'permanent'
          ? 'permanent'
          : Number.isFinite(parsed) && parsed > 0
          ? parsed
          : 24;

      const success = await banContext.banUser(
        sanitizedUsername,
        duration,
        banForm.reason,
        adminUsername,
        sanitizedNotes,
        reportIds,
        sanitizedCustomReason
      );

      if (success) {
        // Update report if it was from a report
        if (selectedReport) {
          const updatedReports = reports.map((r) =>
            r.id === selectedReport.id
              ? {
                  ...r,
                  processed: true,
                  banApplied: true,
                  processedBy: adminUsername,
                  processedAt: new Date().toISOString()
                }
              : r
          );
          await saveReports(updatedReports);
        }

        setShowBanModal(false);
        setSelectedReport(null);
        resetBanForm();

        const durationText = banForm.banType === 'permanent' ? 'permanently' : `for ${duration} hours`;
        alert(`Successfully banned ${sanitizedUsername} ${durationText}`);
      } else {
        alert('Failed to ban user. They may already be banned or invalid parameters provided.');
      }
    } catch (error) {
      console.error('Error applying ban:', error);
      alert('An error occurred while applying the ban.');
    } finally {
      setIsProcessingBan(false);
    }
  };

  // Update ban form with sanitization
  const updateBanForm = (form: BanFormData | ((prev: BanFormData) => BanFormData)) => {
    setBanForm((prev) => {
      const newForm = typeof form === 'function' ? form(prev) : form;

      // Sanitize text fields
      return {
        ...newForm,
        username: sanitizeStrict(newForm.username),
        customReason: sanitizeStrict(newForm.customReason),
        notes: sanitizeStrict(newForm.notes)
      };
    });
  };

  // Reset ban form
  const resetBanForm = () => {
    setBanForm({
      username: '',
      banType: 'temporary',
      hours: '24',
      reason: 'harassment',
      customReason: '',
      notes: ''
    });
  };

  // Mark report as resolved
  const handleMarkResolved = (report: ReportLog) => {
    setSelectedReport(report);
    setShowResolveModal(true);
  };

  const confirmResolve = async () => {
    if (!selectedReport) return;

    const adminUsername = user?.username || 'admin';

    // Update report as processed
    const updatedReports = reports.map((r) =>
      r.id === selectedReport.id
        ? {
            ...r,
            processed: true,
            banApplied: false,
            processedBy: adminUsername,
            processedAt: new Date().toISOString(),
            adminNotes: sanitizeStrict((r.adminNotes || '') + '\n[Resolved without ban]')
          }
        : r
    );
    await saveReports(updatedReports);

    // Add to resolved reports with sanitization (and never save mock)
    const resolvedEntry = {
      reporter: sanitizeStrict(selectedReport.reporter),
      reportee: sanitizeStrict(selectedReport.reportee),
      date: new Date().toISOString(),
      resolvedBy: adminUsername,
      resolvedReason: 'Resolved without ban',
      banApplied: false,
      notes: sanitizeStrict(selectedReport.adminNotes || 'No admin notes')
    };
    if (!(isMockString(resolvedEntry.reporter) || isMockString(resolvedEntry.reportee))) {
      const existingResolved = await storageService.getItem<any[]>('panty_report_resolved', []);
      existingResolved.push(resolvedEntry);
      await storageService.setItem('panty_report_resolved', existingResolved);
    }

    setShowResolveModal(false);
    setSelectedReport(null);
    alert(`Report marked as resolved without ban`);
  };

  // Delete report
  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      const updatedReports = reports.filter((r) => r.id !== reportId);
      await saveReports(updatedReports);
      alert('Report deleted');
    }
  };

  // Update report severity
  const updateReportSeverity = async (reportId: string, severity: ReportLog['severity']) => {
    const updatedReports = reports.map((r) => (r.id === reportId ? { ...r, severity } : r));
    await saveReports(updatedReports);
  };

  // Update report category
  const updateReportCategory = async (reportId: string, category: ReportLog['category']) => {
    const updatedReports = reports.map((r) => (r.id === reportId ? { ...r, category } : r));
    await saveReports(updatedReports);
  };

  // Update admin notes with sanitization
  const updateAdminNotes = async (reportId: string, notes: string) => {
    const sanitizedNotes = sanitizeStrict(notes);
    const updatedReports = reports.map((report) =>
      report.id === reportId ? { ...report, adminNotes: sanitizedNotes } : report
    );
    await saveReports(updatedReports);
  };

  // Handle ban from report
  const handleBanFromReport = (report: ReportLog) => {
    setSelectedReport(report);
    updateBanForm({
      username: report.reportee,
      banType: 'temporary',
      hours: '24',
      reason: report.category || 'harassment',
      customReason: '',
      notes: ''
    });
    setShowBanModal(true);
  };

  // Calculate report stats
  const reportStats: ReportStats = {
    total: reports.length,
    unprocessed: reports.filter((r) => !r.processed).length,
    processed: reports.filter((r) => r.processed).length,
    critical: reports.filter((r) => r.severity === 'critical' && !r.processed).length,
    today: reports.filter((r) => {
      const reportDate = new Date(r.date);
      const today = new Date();
      return reportDate.toDateString() === today.toDateString();
    }).length,
    withBans: reports.filter((r) => r.banApplied).length
  };

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Optional banner if we cleaned mock entries */}
        {mockRemovalCount > 0 && (
          <div className="mb-4 p-3 rounded border border-yellow-600/30 bg-yellow-600/10 text-yellow-300 text-sm">
            Removed {mockRemovalCount} mock report{mockRemovalCount === 1 ? '' : 's'} from storage.
          </div>
        )}

        <Suspense fallback={<div className="h-20 bg-gray-800 rounded mb-6 animate-pulse" />}>
          <ReportsHeader banContextError={banContextError} lastRefresh={lastRefresh} onRefresh={loadReports} />
        </Suspense>

        <Suspense fallback={<AdminStatsSkeleton />}>
          <ReportsStats reportStats={reportStats} />
        </Suspense>

        <Suspense fallback={<FiltersSkeletons />}>
          <ReportsFilters
            searchTerm={searchTerm}
            setSearchTerm={handleSearchTermChange}
            filterBy={filterBy}
            setFilterBy={setFilterBy}
            severityFilter={severityFilter}
            setSeverityFilter={setSeverityFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </Suspense>

        {isLoadingReports ? (
          <ReportListSkeleton count={5} />
        ) : (
          <Suspense fallback={<ReportListSkeleton count={5} />}>
            <ReportsList
              reports={filteredAndSortedReports}
              searchTerm={searchTerm}
              expandedReports={expandedReports}
              toggleExpanded={toggleExpanded}
              onBan={handleBanFromReport}
              onResolve={handleMarkResolved}
              onDelete={handleDeleteReport}
              onUpdateSeverity={updateReportSeverity}
              onUpdateCategory={updateReportCategory}
              onUpdateAdminNotes={updateAdminNotes}
              getUserReportStats={getUserReportStats}
              banContext={banContext}
              reportBanInfo={reportBanInfo}
            />
          </Suspense>
        )}

        {showBanModal && (
          <Suspense fallback={<ModalSkeleton />}>
            <BanModal
              isOpen={showBanModal}
              banForm={banForm}
              setBanForm={updateBanForm}
              isProcessing={isProcessingBan}
              onClose={() => {
                setShowBanModal(false);
                resetBanForm();
              }}
              onConfirm={handleManualBan}
            />
          </Suspense>
        )}

        {showResolveModal && (
          <Suspense fallback={<ModalSkeleton />}>
            <ResolveModal
              isOpen={showResolveModal}
              report={selectedReport}
              onClose={() => {
                setShowResolveModal(false);
                setSelectedReport(null);
              }}
              onConfirm={confirmResolve}
            />
          </Suspense>
        )}
      </main>
    </RequireAuth>
  );
}
