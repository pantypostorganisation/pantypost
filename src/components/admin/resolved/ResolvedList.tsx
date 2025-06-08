// src/components/admin/resolved/ResolvedList.tsx
'use client';

import { Archive } from 'lucide-react';
import ResolvedEntry from './ResolvedEntry';
import type { ResolvedListProps } from '@/types/resolved';

export default function ResolvedList({
  reports,
  expandedReports,
  selectedReports,
  onToggleExpanded,
  onToggleSelected,
  onRestore,
  onDelete,
  filters
}: ResolvedListProps) {
  // Filter and sort reports
  const filteredAndSortedReports = (() => {
    let filtered = reports.filter(report => {
      const matchesSearch = filters.searchTerm ?
        report.reporter.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        report.reportee.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (report.notes && report.notes.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (report.resolvedReason && report.resolvedReason.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        : true;

      const matchesFilter = 
        filters.filterBy === 'all' ? true :
        filters.filterBy === 'banned' ? report.banApplied === true :
        report.banApplied === false;

      return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'reporter':
          comparison = a.reporter.localeCompare(b.reporter);
          break;
        case 'reportee':
          comparison = a.reportee.localeCompare(b.reportee);
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  })();

  if (filteredAndSortedReports.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
        <Archive size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No resolved reports found</p>
        {filters.searchTerm && (
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your search terms or filters
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedReports.map((report, index) => {
        const reportId = report.id || `${report.reporter}-${report.reportee}-${report.date}`;
        
        return (
          <ResolvedEntry
            key={reportId}
            report={report}
            index={index}
            isExpanded={expandedReports.has(reportId)}
            isSelected={selectedReports.has(reportId)}
            onToggleExpanded={() => onToggleExpanded(reportId)}
            onToggleSelected={() => onToggleSelected(reportId)}
            onRestore={() => onRestore(report)}
            onDelete={() => onDelete(reportId)}
          />
        );
      })}
    </div>
  );
}
