// src/app/admin/resolved/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import ResolvedHeader from '@/components/admin/resolved/ResolvedHeader';
import ResolvedStats from '@/components/admin/resolved/ResolvedStats';
import ResolvedFilters from '@/components/admin/resolved/ResolvedFilters';
import BulkActions from '@/components/admin/resolved/BulkActions';
import ResolvedList from '@/components/admin/resolved/ResolvedList';
import RestoreModal from '@/components/admin/resolved/RestoreModal';
import { AlertTriangle } from 'lucide-react';
import { storageService } from '@/services';
import { sanitizeStrict, sanitizeObject } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import type { ResolvedReport, FilterOptions, ResolvedStats as StatsType } from '@/types/resolved';

// --- Conservative mock data detector ---
const isMockString = (val?: string) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  // Obvious dev/demo patterns only (avoid nuking real data)
  const patterns = [
    'spammer', 'scammer', 'troublemaker', 'oldbanner',
    'mock', 'sample', 'demo', 'test',
    'lorem', 'ipsum', 'john_doe', 'jane_doe'
  ];
  return patterns.some(p => v.includes(p));
};

const isMockResolved = (r: ResolvedReport) =>
  isMockString(r.reporter) ||
  isMockString(r.reportee) ||
  isMockString(r.resolvedBy) ||
  isMockString(r.resolvedReason) ||
  isMockString(r.notes) ||
  isMockString(r.adminNotes) ||
  (r.id && (r.id.startsWith?.('mock_') || r.id.includes('sample') || r.id.includes('test')));
// --------------------------------------

export default function ResolvedReportsPage() {
  const { user } = useAuth();
  const [resolved, setResolved] = useState<ResolvedReport[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    filterBy: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [reportToRestore, setReportToRestore] = useState<ResolvedReport | null>(null);

  useEffect(() => {
    loadResolvedReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResolvedReports = async () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = await storageService.getItem<ResolvedReport[]>('panty_report_resolved', []);
        // Add IDs if missing and sanitize text fields
        const reportsWithIds = (stored || []).map((report, index) => ({
          ...report,
          id: report.id || `${report.reporter}-${report.reportee}-${report.date}-${index}`,
          reporter: sanitizeStrict(report.reporter || ''),
          reportee: sanitizeStrict(report.reportee || ''),
          resolvedBy: sanitizeStrict(report.resolvedBy || ''),
          resolvedReason: sanitizeStrict(report.resolvedReason || ''),
          notes: sanitizeStrict(report.notes || ''),
          adminNotes: report.adminNotes ? sanitizeStrict(report.adminNotes) : undefined
        }));
        // Remove any obvious mock/dev entries
        const cleansed = reportsWithIds.filter(r => !isMockResolved(r));
        if (cleansed.length !== reportsWithIds.length) {
          await storageService.setItem('panty_report_resolved', cleansed);
        }
        setResolved(cleansed);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error loading resolved reports:', error);
        setResolved([]);
      }
    }
  };

  const saveResolved = async (newResolved: ResolvedReport[]) => {
    // Sanitize before saving and never persist mock entries
    const sanitizedResolved = newResolved
      .map(report => ({
        ...report,
        reporter: sanitizeStrict(report.reporter || ''),
        reportee: sanitizeStrict(report.reportee || ''),
        resolvedBy: sanitizeStrict(report.resolvedBy || ''),
        resolvedReason: sanitizeStrict(report.resolvedReason || ''),
        notes: sanitizeStrict(report.notes || ''),
        adminNotes: report.adminNotes ? sanitizeStrict(report.adminNotes) : undefined
      }))
      .filter(r => !isMockResolved(r));

    setResolved(sanitizedResolved);
    await storageService.setItem('panty_report_resolved', sanitizedResolved);
  };

  // Toggle expanded state
  const toggleExpanded = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Toggle selection
  const toggleSelection = (reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // Select all
  const selectAll = () => {
    if (selectedReports.size === resolved.length) {
      setSelectedReports(new Set());
    } else {
      const allIds = resolved.map(r => r.id || `${r.reporter}-${r.reportee}-${r.date}`);
      setSelectedReports(new Set(allIds));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedReports(new Set());
  };

  // Handle filter changes with sanitization
  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    const sanitizedFilters: Partial<FilterOptions> = { ...newFilters };

    if ('searchTerm' in sanitizedFilters && sanitizedFilters.searchTerm) {
      sanitizedFilters.searchTerm = securityService.sanitizeSearchQuery(sanitizedFilters.searchTerm);
    }

    setFilters(prev => ({ ...prev, ...sanitizedFilters }));
  };

  // Handle restore
  const handleRestore = (report: ResolvedReport) => {
    setReportToRestore(report);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!reportToRestore) return;
    // Don't restore obvious mock rows
    if (isMockResolved(reportToRestore)) {
      setShowRestoreModal(false);
      setReportToRestore(null);
      alert('Cannot restore mock/demo report.');
      return;
    }

    // Generate a new report entry for active reports with sanitized data
    const newReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporter: sanitizeStrict(reportToRestore.reporter),
      reportee: sanitizeStrict(reportToRestore.reportee),
      messages: Array.isArray(reportToRestore.messages) ? reportToRestore.messages : [],
      date: reportToRestore.originalReportDate || reportToRestore.date,
      processed: false,
      severity: reportToRestore.severity,
      category: reportToRestore.category,
      adminNotes: sanitizeStrict(
        `[Restored from resolved on ${new Date().toLocaleString()}]\n${reportToRestore.adminNotes || reportToRestore.notes || ''}`
      )
    };

    // Add to active reports
    const existingReports = await storageService.getItem<any[]>('panty_report_logs', []);
    // Avoid restoring into mock space too
    const cleanedExisting = (existingReports || []).filter((r) => !isMockString(r?.reporter) && !isMockString(r?.reportee));
    cleanedExisting.push(newReport);
    await storageService.setItem('panty_report_logs', cleanedExisting);

    // Remove from resolved
    const reportId = reportToRestore.id || `${reportToRestore.reporter}-${reportToRestore.reportee}-${reportToRestore.date}`;
    await handleDelete(reportId);

    // Dispatch event to update report counter
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('updateReports'));
    }

    setShowRestoreModal(false);
    setReportToRestore(null);
    alert(`Restored report from ${sanitizeStrict(newReport.reporter)} about ${sanitizeStrict(newReport.reportee)}.`);
  };

  // Handle delete
  const handleDelete = async (reportId: string) => {
    const updatedResolved = resolved.filter(r => {
      const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
      return rId !== reportId;
    });
    await saveResolved(updatedResolved);

    // Remove from selection if selected
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  };

  // Bulk actions
  const handleBulkRestore = async () => {
    if (selectedReports.size === 0) return;

    if (confirm(`Are you sure you want to restore ${selectedReports.size} reports?`)) {
      const toRestore = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return selectedReports.has(rId);
      }).filter(r => !isMockResolved(r)); // never restore mock

      // Get existing reports
      const existingReports = await storageService.getItem<any[]>('panty_report_logs', []);
      const cleanedExisting = (existingReports || []).filter((r) => !isMockString(r?.reporter) && !isMockString(r?.reportee));

      toRestore.forEach(report => {
        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reporter: sanitizeStrict(report.reporter),
          reportee: sanitizeStrict(report.reportee),
          messages: Array.isArray(report.messages) ? report.messages : [],
          date: report.originalReportDate || report.date,
          processed: false,
          severity: report.severity,
          category: report.category,
          adminNotes: sanitizeStrict(
            `[Restored from resolved on ${new Date().toLocaleString()}]\n${report.adminNotes || report.notes || ''}`
          )
        };
        cleanedExisting.push(newReport);
      });

      // Save updated reports
      await storageService.setItem('panty_report_logs', cleanedExisting);

      // Remove from resolved
      const updatedResolved = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return !selectedReports.has(rId);
      });
      await saveResolved(updatedResolved);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('updateReports'));
      }
      clearSelection();
      alert(`${toRestore.length} reports restored.`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;

    if (confirm(`Are you sure you want to permanently delete ${selectedReports.size} reports? This cannot be undone.`)) {
      const updatedResolved = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return !selectedReports.has(rId);
      });
      await saveResolved(updatedResolved);
      clearSelection();
      alert(`${selectedReports.size} reports deleted.`);
    }
  };

  // Export data with sanitization
  const exportData = () => {
    const sanitizedData = {
      resolvedReports: resolved.map(report => sanitizeObject(report, {
        maxDepth: 3,
        keySanitizer: (key) => sanitizeStrict(key),
        valueSanitizer: (value) => {
          if (typeof value === 'string') {
            return sanitizeStrict(value);
          }
          return value;
        }
      })),
      exportDate: new Date().toISOString(),
      exportedBy: sanitizeStrict(user?.username || 'admin'),
      totalRecords: resolved.length
    };

    const blob = new Blob([JSON.stringify(sanitizedData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resolved-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data with validation and sanitization
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validationResult = securityService.validateFileUpload(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/json'],
      allowedExtensions: ['json']
    });

    if (!validationResult.valid) {
      alert(validationResult.error || 'Invalid file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.resolvedReports && Array.isArray(data.resolvedReports)) {
          const imported = data.resolvedReports as ResolvedReport[];

          // Sanitize imported data
          const sanitizedImports = imported.map((report, index) => ({
            ...report,
            id: report.id || `${report.reporter}-${report.reportee}-${report.date}-imported-${index}`,
            reporter: sanitizeStrict(report.reporter || ''),
            reportee: sanitizeStrict(report.reportee || ''),
            resolvedBy: sanitizeStrict(report.resolvedBy || ''),
            resolvedReason: sanitizeStrict(report.resolvedReason || ''),
            notes: sanitizeStrict(report.notes || ''),
            adminNotes: report.adminNotes ? sanitizeStrict(report.adminNotes) : undefined
          }))
          // Never import mock entries
          .filter(r => !isMockResolved(r));

          const merged = [...resolved, ...sanitizedImports];
          // Remove duplicates based on reporter + reportee + date
          const unique = merged.filter((report, index, self) =>
            index === self.findIndex((r) => (
              r.reporter === report.reporter &&
              r.reportee === report.reportee &&
              r.date === report.date
            ))
          );
          await saveResolved(unique);
          alert(`Imported ${sanitizedImports.length} reports. Total: ${unique.length}`);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing file');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };

  // Calculate stats
  const stats: StatsType = {
    total: resolved.length,
    withBans: resolved.filter(r => r.banApplied).length,
    withoutBans: resolved.filter(r => !r.banApplied).length,
    today: resolved.filter(r => {
      const reportDate = new Date(r.date);
      const today = new Date();
      return reportDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: resolved.filter(r => {
      const reportDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reportDate >= weekAgo;
    }).length
  };

  // Clean role-based admin access
  if (!user || user.role !== 'admin') {
    return (
      <RequireAuth role="admin">
        <main className="p-8 max-w-4xl mx-auto">
          <div className="bg-[#1a1a1a] border border-red-800 rounded-lg p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4 text-red-400">🔒 Access Denied</h1>
            <p className="text-gray-400">You do not have permission to view this page.</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center mx-auto"
            >
              Go Back
            </button>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="p-8 max-w-7xl mx-auto">
        <ResolvedHeader
          lastRefresh={lastRefresh}
          onRefresh={loadResolvedReports}
          onExport={exportData}
          onImport={handleImport}
        />

        <ResolvedStats stats={stats} />

        <ResolvedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        <BulkActions
          selectedCount={selectedReports.size}
          totalCount={resolved.length}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onBulkRestore={handleBulkRestore}
          onBulkDelete={handleBulkDelete}
        />

        <ResolvedList
          reports={resolved}
          expandedReports={expandedReports}
          selectedReports={selectedReports}
          onToggleExpanded={toggleExpanded}
          onToggleSelected={toggleSelection}
          onRestore={handleRestore}
          onDelete={handleDelete}
          filters={filters}
        />

        <RestoreModal
          isOpen={showRestoreModal}
          report={reportToRestore}
          onClose={() => {
            setShowRestoreModal(false);
            setReportToRestore(null);
          }}
          onConfirm={confirmRestore}
        />
      </main>
    </RequireAuth>
  );
}
