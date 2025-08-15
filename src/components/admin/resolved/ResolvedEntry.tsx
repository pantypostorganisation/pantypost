// src/components/admin/resolved/ResolvedEntry.tsx
'use client';

import { useMemo } from 'react';
import {
  User, Calendar, Shield, AlertTriangle, ChevronDown, ChevronUp,
  RotateCcw, Trash2, MessageSquare, FileText
} from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import type { ResolvedEntryProps } from '@/types/resolved';
import { sanitizeStrict } from '@/utils/security/sanitization';

const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-green-500';
    default: return 'text-gray-500';
  }
};

const getSeverityIcon = (severity?: string) => {
  switch (severity) {
    case 'critical': return Shield;
    case 'high': return AlertTriangle;
    case 'medium': return AlertTriangle;
    case 'low': return AlertTriangle;
    default: return AlertTriangle;
  }
};

const safeDate = (d?: string | number | Date) => {
  const dd = d ? new Date(d) : null;
  return dd && Number.isFinite(dd.getTime()) ? dd.toLocaleDateString() : '—';
};

export default function ResolvedEntry({
  report,
  index,
  isExpanded,
  isSelected,
  onToggleExpanded,
  onToggleSelected,
  onRestore,
  onDelete
}: ResolvedEntryProps) {
  const SeverityIcon = getSeverityIcon(report?.severity);

  const prettyCategory = useMemo(() => {
    const c = (report?.category ?? '').toString().replace(/_/g, ' ');
    return c ? sanitizeStrict(c) : '—';
  }, [report?.category]);

  const resolvedBy = sanitizeStrict(report?.resolvedBy ?? 'Unknown');
  const resolvedReason = sanitizeStrict(report?.resolvedReason ?? 'No reason provided');

  return (
    <div
      className={`bg-[#1a1a1a] border ${
        isSelected ? 'border-[#ff950e]' : 'border-gray-800'
      } rounded-lg overflow-hidden hover:border-gray-700 transition-all`}
      role="group"
      aria-label={`Resolved report ${index + 1}`}
    >
      {/* Report Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={onToggleSelected}
            className="mt-1 w-4 h-4 text-[#ff950e] bg-gray-700 border-gray-600 rounded focus:ring-[#ff950e]"
            aria-label="Select resolved report"
          />

          {/* Main Content */}
          <div
            className="flex-1 cursor-pointer"
            onClick={onToggleExpanded}
            role="button"
            aria-expanded={!!isExpanded}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleExpanded();
              }
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="font-semibold text-white">
                      <SecureMessageDisplay
                        content={report?.reporter ?? ''}
                        className="inline"
                        maxLength={120}
                        allowBasicFormatting={false}
                      />
                      {' '}&rarr;{' '}
                      <SecureMessageDisplay
                        content={report?.reportee ?? ''}
                        className="inline"
                        maxLength={120}
                        allowBasicFormatting={false}
                      />
                    </span>
                  </div>

                  {report?.banApplied ? (
                    <span className="px-2 py-0.5 bg-red-900/20 text-red-400 text-xs rounded-md border border-red-800">
                      Ban Applied
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-900/20 text-green-400 text-xs rounded-md border border-green-800">
                      No Ban
                    </span>
                  )}

                  {report?.severity && (
                    <div className={`flex items-center gap-1 ${getSeverityColor(report.severity)}`}>
                      <SeverityIcon size={14} />
                      <span className="text-xs font-medium uppercase">{sanitizeStrict(report.severity)}</span>
                    </div>
                  )}

                  {report?.category && (
                    <span className="text-xs text-gray-400">
                      {prettyCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Resolved: {safeDate(report?.date)}</span>
                  </div>
                  {report?.resolvedBy && (
                    <span>By: {resolvedBy}</span>
                  )}
                  {report?.resolvedReason && (
                    <span>Reason: {resolvedReason}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                  className="p-2 hover:bg-[#222] rounded transition"
                  title="Restore to active reports"
                  aria-label="Restore report to active"
                >
                  <RotateCcw size={16} className="text-yellow-500" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 hover:bg-[#222] rounded transition"
                  title="Delete permanently"
                  aria-label="Delete report permanently"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
                <div className="pl-2" aria-hidden>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-800 bg-[#0d0d0d] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <FileText size={14} />
                Report Details
              </h4>
              <div className="space-y-2 text-sm">
                {report?.originalReportDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Original Report Date:</span>
                    <span className="text-gray-300">{safeDate(report.originalReportDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolution Date:</span>
                  <span className="text-gray-300">{safeDate(report?.date)}</span>
                </div>
                {report?.banId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ban ID:</span>
                    <span className="text-gray-300 font-mono text-xs">{sanitizeStrict(report.banId)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Processing Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved By:</span>
                  <span className="text-gray-300">{resolvedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolution:</span>
                  <span className="text-gray-300">{resolvedReason}</span>
                </div>
                {typeof report?.banApplied === 'boolean' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ban Applied:</span>
                    <span className={report.banApplied ? 'text-red-400' : 'text-green-400'}>
                      {report.banApplied ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {(report?.notes || report?.adminNotes) && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Admin Notes</h4>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3">
                <SecureMessageDisplay
                  content={report?.notes || report?.adminNotes || ''}
                  className="text-sm text-gray-400 whitespace-pre-wrap"
                  allowBasicFormatting={false}
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {Array.isArray(report?.messages) && report.messages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MessageSquare size={14} />
                Reported Messages ({report.messages.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {report.messages.map((msg, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-white">
                        <SecureMessageDisplay
                          content={msg.sender}
                          className="inline"
                          allowBasicFormatting={false}
                          maxLength={120}
                        />
                        {' '}&rarr;{' '}
                        <SecureMessageDisplay
                          content={msg.receiver}
                          className="inline"
                          allowBasicFormatting={false}
                          maxLength={120}
                        />
                      </span>
                      <span className="text-xs text-gray-500">
                        {safeDate(msg.date)} {new Date(msg.date).toLocaleTimeString?.()}
                      </span>
                    </div>
                    <SecureMessageDisplay
                      content={msg.content}
                      className="text-sm text-gray-300"
                      allowBasicFormatting={false}
                      maxLength={500}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
