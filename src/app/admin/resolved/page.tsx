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
import type { ResolvedReport, FilterOptions, ResolvedStats as StatsType } from '@/types/resolved';

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
  }, []);

  const loadResolvedReports = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('panty_report_resolved');
      if (stored) {
        try {
          const parsed: ResolvedReport[] = JSON.parse(stored);
          // Add IDs if missing
          const reportsWithIds = parsed.map((report, index) => ({
            ...report,
            id: report.id || `${report.reporter}-${report.reportee}-${report.date}-${index}`
          }));
          setResolved(reportsWithIds);
          setLastRefresh(new Date());
        } catch (error) {
          console.error('Error parsing resolved reports:', error);
          setResolved([]);
        }
      }
    }
  };

  const saveResolved = (newResolved: ResolvedReport[]) => {
    setResolved(newResolved);
    localStorage.setItem('panty_report_resolved', JSON.stringify(newResolved));
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

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle restore
  const handleRestore = (report: ResolvedReport) => {
    setReportToRestore(report);
    setShowRestoreModal(true);
  };

  const confirmRestore = () => {
    if (!reportToRestore) return;

    // Generate a new report entry for active reports
    const newReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reporter: reportToRestore.reporter,
      reportee: reportToRestore.reportee,
      messages: reportToRestore.messages || [],
      date: reportToRestore.originalReportDate || reportToRestore.date,
      processed: false,
      severity: reportToRestore.severity,
      category: reportToRestore.category,
      adminNotes: `[Restored from resolved on ${new Date().toLocaleString()}]\n${reportToRestore.adminNotes || reportToRestore.notes || ''}`
    };

    // Add to active reports
    const existingReportsRaw = localStorage.getItem('panty_report_logs');
    const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
    existingReports.push(newReport);
    localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));

    // Remove from resolved
    const reportId = reportToRestore.id || `${reportToRestore.reporter}-${reportToRestore.reportee}-${reportToRestore.date}`;
    handleDelete(reportId);

    // Dispatch event to update report counter
    window.dispatchEvent(new Event('updateReports'));

    setShowRestoreModal(false);
    setReportToRestore(null);
    alert(`Restored report from ${reportToRestore.reporter} about ${reportToRestore.reportee}.`);
  };

  // Handle delete
  const handleDelete = (reportId: string) => {
    const updatedResolved = resolved.filter(r => {
      const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
      return rId !== reportId;
    });
    saveResolved(updatedResolved);
    
    // Remove from selection if selected
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      newSet.delete(reportId);
      return newSet;
    });
  };

  // Bulk actions
  const handleBulkRestore = () => {
    if (selectedReports.size === 0) return;
    
    if (confirm(`Are you sure you want to restore ${selectedReports.size} reports?`)) {
      const toRestore = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return selectedReports.has(rId);
      });
      
      toRestore.forEach(report => {
        // Add to active reports
        const newReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reporter: report.reporter,
          reportee: report.reportee,
          messages: report.messages || [],
          date: report.originalReportDate || report.date,
          processed: false,
          severity: report.severity,
          category: report.category,
          adminNotes: `[Restored from resolved on ${new Date().toLocaleString()}]\n${report.adminNotes || report.notes || ''}`
        };

        const existingReportsRaw = localStorage.getItem('panty_report_logs');
        const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
        existingReports.push(newReport);
        localStorage.setItem('panty_report_logs', JSON.stringify(existingReports));
      });

      // Remove from resolved
      const updatedResolved = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return !selectedReports.has(rId);
      });
      saveResolved(updatedResolved);
      
      window.dispatchEvent(new Event('updateReports'));
      clearSelection();
      alert(`${toRestore.length} reports restored.`);
    }
  };

  const handleBulkDelete = () => {
    if (selectedReports.size === 0) return;
    
    if (confirm(`Are you sure you want to permanently delete ${selectedReports.size} reports? This cannot be undone.`)) {
      const updatedResolved = resolved.filter(r => {
        const rId = r.id || `${r.reporter}-${r.reportee}-${r.date}`;
        return !selectedReports.has(rId);
      });
      saveResolved(updatedResolved);
      clearSelection();
      alert(`${selectedReports.size} reports deleted.`);
    }
  };

  // Export data
  const exportData = () => {
    const data = {
      resolvedReports: resolved,
      exportDate: new Date().toISOString(),
      exportedBy: user?.username || 'admin',
      totalRecords: resolved.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
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

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.resolvedReports && Array.isArray(data.resolvedReports)) {
          const imported = data.resolvedReports as ResolvedReport[];
          // Add IDs if missing
          const importedWithIds = imported.map((report, index) => ({
            ...report,
            id: report.id || `${report.reporter}-${report.reportee}-${report.date}-imported-${index}`
          }));
          const merged = [...resolved, ...importedWithIds];
          // Remove duplicates based on reporter + reportee + date
          const unique = merged.filter((report, index, self) =>
            index === self.findIndex((r) => (
              r.reporter === report.reporter &&
              r.reportee === report.reportee &&
              r.date === report.date
            ))
          );
          saveResolved(unique);
          alert(`Imported ${imported.length} reports. Total: ${unique.length}`);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error importing file');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
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

  // Check admin access
  if (!user || (user.username !== 'oakley' && user.username !== 'gerome')) {
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
