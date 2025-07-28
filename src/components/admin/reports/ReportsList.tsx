// src/components/admin/reports/ReportsList.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import ReportCard from './ReportCard';
import { ReportsListProps } from './types';

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
  
  if (!Array.isArray(reports) || reports.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
        <AlertTriangle size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No reports found</p>
        {searchTerm && (
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your search terms or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        // Validate report structure
        if (!report || typeof report.id !== 'string' || !report.id || typeof report.reportee !== 'string' || !report.reportee) {
          return null;
        }
        
        // TypeScript now knows these are definitely strings
        const reportId: string = report.id;
        const reportee: string = report.reportee;
        
        const userBanInfo = reportBanInfo[reportee];
        const userStats = getUserReportStats(reportee);
        const isExpanded = expandedReports.has(reportId);
        
        return (
          <ReportCard
            key={reportId}
            report={report}
            isExpanded={isExpanded}
            onToggle={() => toggleExpanded(reportId)}
            onBan={() => onBan(report)}
            onResolve={() => onResolve(report)}
            onDelete={() => onDelete(reportId)}
            onUpdateSeverity={(severity) => onUpdateSeverity(reportId, severity)}
            onUpdateCategory={(category) => onUpdateCategory(reportId, category)}
            onUpdateAdminNotes={(notes) => onUpdateAdminNotes(reportId, notes)}
            userStats={userStats}
            userBanInfo={userBanInfo}
            banContext={banContext}
          />
        );
      }).filter(Boolean)}
    </div>
  );
}