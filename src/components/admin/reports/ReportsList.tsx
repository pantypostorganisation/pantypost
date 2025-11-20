// src/components/admin/reports/ReportsList.tsx
'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import ReportCard from './ReportCard';
import { ReportsListProps } from './types';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function ReportsList({
  reports,
  searchTerm,
  expandedReports,
  toggleExpanded,
  onBan,
  onResolve,
  onDelete,
  onUpdateSeverity,
  onUpdateCategory,
  onUpdateAdminNotes,
  getUserReportStats,
  banContext,
  reportBanInfo
}: ReportsListProps) {

  const safeReports = useMemo(() => Array.isArray(reports) ? reports : [], [reports]);

  if (safeReports.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-10 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4 text-zinc-600" />
        <p className="text-base font-medium text-zinc-300">No reports found</p>
        {searchTerm && (
          <p className="mt-2 text-sm text-zinc-500">
            Try adjusting your search terms or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {safeReports.map((report, index) => {
        // Validate report structure
        if (!report || typeof report.id !== 'string' || !report.id || typeof report.reportee !== 'string' || !report.reportee) {
          return null;
        }

        // Narrow to definitely-strings
        const reportId: string = report.id;
        const reportee: string = report.reportee;

        const userBanInfo = reportBanInfo[reportee] ?? null;
        const userStats = getUserReportStats(reportee);
        const isExpanded = expandedReports.has(reportId);

        return (
          <ReportCard
            key={`${reportId}_${index}`}  // Add index to ensure uniqueness even with duplicate IDs
            report={report}
            isExpanded={isExpanded}
            onToggle={() => toggleExpanded(reportId)}
            onBan={() => onBan(report)}
            onResolve={() => onResolve(report)}
            onDelete={() => onDelete(reportId)}
            onUpdateSeverity={(severity) => onUpdateSeverity(reportId, severity)}
            onUpdateCategory={(category) => onUpdateCategory(reportId, category)}
            onUpdateAdminNotes={(notes) => onUpdateAdminNotes(reportId, sanitizeStrict(notes))}
            userStats={userStats}
            userBanInfo={userBanInfo}
            banContext={banContext}
          />
        );
      }).filter(Boolean)}
    </div>
  );
}
