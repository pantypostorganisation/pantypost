// src/components/admin/resolved/ResolvedList.tsx
'use client';

import { useMemo } from 'react';
import { Archive } from 'lucide-react';
import ResolvedEntry from './ResolvedEntry';
import type { ResolvedListProps } from '@/types/resolved';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';

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
  const sanitizedSearchTerm = (filters?.searchTerm ? sanitizeSearchQuery(filters.searchTerm) : '').toLowerCase();

  const filteredAndSortedReports = useMemo(() => {
    const safeReports = Array.isArray(reports) ? reports : [];

    const filtered = safeReports.filter((report) => {
      const reporter = (report?.reporter || '').toString().toLowerCase();
      const reportee = (report?.reportee || '').toString().toLowerCase();
      const notes = (report?.notes || '').toString().toLowerCase();
      const reason = (report?.resolvedReason || '').toString().toLowerCase();

      const matchesSearch = sanitizedSearchTerm
        ? reporter.includes(sanitizedSearchTerm) ||
          reportee.includes(sanitizedSearchTerm) ||
          notes.includes(sanitizedSearchTerm) ||
          reason.includes(sanitizedSearchTerm)
        : true;

      const matchesFilter =
        filters.filterBy === 'all'
          ? true
          : filters.filterBy === 'banned'
            ? report?.banApplied === true
            : report?.banApplied === false;

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a?.date ?? 0).getTime() - new Date(b?.date ?? 0).getTime();
          break;
        case 'reporter':
          comparison = (a?.reporter || '').localeCompare(b?.reporter || '');
          break;
        case 'reportee':
          comparison = (a?.reportee || '').localeCompare(b?.reportee || '');
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [reports, filters.sortBy, filters.sortOrder, filters.filterBy, sanitizedSearchTerm]);

  if (filteredAndSortedReports.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
        <Archive size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No resolved reports found</p>
        {sanitizedSearchTerm && (
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
        const fallbackId = `${report?.reporter ?? 'unknown'}-${report?.reportee ?? 'unknown'}-${report?.date ?? index}`;
        const reportId = (report?.id && String(report.id)) || fallbackId;

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
