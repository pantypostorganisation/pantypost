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
  
  if (reports.length === 0) {
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
        if (!report || !report.id || !report.reportee) {
          return null;
        }
        
        const userBanInfo = reportBanInfo[report.reportee];
        const userStats = getUserReportStats(report.reportee);
        const isExpanded = expandedReports.has(report.id);
        
        return (
          <ReportCard
            key={report.id}
            report={report}
            isExpanded={isExpanded}
            onToggle={() => toggleExpanded(report.id!)}
            onBan={() => onBan(report)}
            onResolve={() => onResolve(report)}
            onDelete={() => onDelete(report.id!)}
            onUpdateSeverity={(severity) => onUpdateSeverity(report.id!, severity)}
            onUpdateCategory={(category) => onUpdateCategory(report.id!, category)}
            onUpdateAdminNotes={(notes) => onUpdateAdminNotes(report.id!, notes)}
            userStats={userStats}
            userBanInfo={userBanInfo}
            banContext={banContext}
          />
        );
      })}
    </div>
  );
}
