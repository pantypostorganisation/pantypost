// src/components/admin/reports/ReportDetails.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BarChart3, MessageSquare, FileText } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { ReportDetailsProps } from './types';

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
type Severity = typeof SEVERITIES[number];

const CATEGORIES = ['harassment', 'spam', 'inappropriate_content', 'scam', 'other'] as const;
type Category = typeof CATEGORIES[number];

export default function ReportDetails({
  report,
  userStats,
  onUpdateSeverity,
  onUpdateCategory,
  onUpdateAdminNotes
}: ReportDetailsProps) {
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdminNotesChange = (value: string) => {
    // Sanitize admin notes input
    const sanitizedValue = sanitizeStrict(value);
    setAdminNotes(sanitizedValue);
  };

  // Guarded handlers: only propagate allowed values
  const handleSeverityChange = useCallback(
    (value: string) => {
      const next = value.toLowerCase();
      if ((SEVERITIES as readonly string[]).includes(next)) {
        onUpdateSeverity(next as Severity);
      }
    },
    [onUpdateSeverity]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      const next = value.toLowerCase();
      if ((CATEGORIES as readonly string[]).includes(next)) {
        onUpdateCategory(next as Category);
      }
    },
    [onUpdateCategory]
  );

  // Auto-save admin notes with debounce
  useEffect(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      onUpdateAdminNotes(adminNotes);
    }, 1000);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
    };
  }, [adminNotes, onUpdateAdminNotes]);

  // Normalize numeric stats safely
  const stats = useMemo(() => {
    const safe = (n: any) => {
      const num = Number(n);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    };
    return {
      totalReports: safe(userStats.totalReports),
      activeReports: safe(userStats.activeReports),
      processedReports: safe(userStats.processedReports),
    };
  }, [userStats]);

  const remainingText = useMemo(() => {
    if (!userStats.isBanned) return null;
    if (userStats.banInfo?.banType === 'permanent') return 'Permanent ban';
    const left = Number(userStats.banInfo?.remainingHours ?? 0);
    return `${Math.max(0, Math.ceil(left))} hours remaining`;
  }, [userStats]);

  return (
    <div className="border-t border-zinc-900/80 pt-5 text-sm text-zinc-300">
      <div className="space-y-5">
        {/* User Report History - Simple Statistics */}
      <div className="rounded-2xl border border-zinc-900/80 bg-zinc-950/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#ff950e]">
          <BarChart3 size={16} />
          <span>Report summary for {sanitizeStrict(report.reportee)}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm text-zinc-300 md:grid-cols-3">
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Total Reports</span>
            <span className="text-base font-semibold text-zinc-100">{stats.totalReports}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Active Reports</span>
            <span className="text-base font-semibold text-red-300">{stats.activeReports}</span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs uppercase tracking-wide text-zinc-500">Processed Reports</span>
            <span className="text-base font-semibold text-emerald-300">{stats.processedReports}</span>
          </div>
        </div>

        {userStats.isBanned && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            <div className="font-medium">Currently banned</div>
            <div className="text-xs text-red-200 opacity-80">{remainingText}</div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <MessageSquare size={14} />
          Conversation ({report.messages?.length || 0} messages)
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-zinc-900/80 bg-zinc-950/40 p-3">
          {report.messages && report.messages.length > 0 ? (
            report.messages.map((msg, idx) => (
              <div
                key={`${msg.sender}-${msg.date}-${idx}`}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  msg.sender === report.reporter
                    ? 'border-[#ff950e]/40 bg-[#ff950e]/10 text-[#ffb347]'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium text-zinc-200">{sanitizeStrict(msg.sender)}</span>
                  <span>{new Date(msg.date).toLocaleString()}</span>
                </div>
                <SecureMessageDisplay
                  content={msg.content}
                  className="mt-2 text-sm"
                  allowBasicFormatting={false}
                  maxLength={500}
                />
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-zinc-500">No messages available</div>
          )}
        </div>
      </div>

      {/* Severity and Category Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="severity-select" className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">Severity</label>
          <select
            id="severity-select"
            aria-label="Set report severity"
            value={SEVERITIES.includes((report.severity as any)) ? report.severity : 'medium'}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
          >
            {SEVERITIES.map(s => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category-select" className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">Category</label>
          <select
            id="category-select"
            aria-label="Set report category"
            value={CATEGORIES.includes((report.category as any)) ? report.category : 'other'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c === 'inappropriate_content' ? 'Inappropriate Content' : c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
          <FileText size={14} className="text-zinc-500" />
          <span className="font-medium">Admin Notes</span>
          <span className="text-xs text-zinc-500">(Auto-saves)</span>
        </div>
        <SecureTextarea
          value={adminNotes}
          onChange={handleAdminNotesChange}
          placeholder="Add internal notes about this report..."
          rows={3}
          maxLength={1000}
          characterCount={true}
          sanitize={true}
          sanitizer={sanitizeStrict}
          aria-label="Admin notes"
        />
      </div>

      {/* Processed Info */}
      {report.processed && (
        <div className="rounded-2xl border border-zinc-900/80 bg-zinc-950/60 p-4 text-sm text-zinc-300">
          <div>
            Processed by: <span className="font-medium text-zinc-100">{sanitizeStrict(report.processedBy || 'Unknown')}</span>
          </div>
          {report.processedAt && (
            <div className="mt-1">
              Processed at: <span className="font-medium text-zinc-100">{new Date(report.processedAt).toLocaleString()}</span>
            </div>
          )}
          {report.banApplied && (
            <div className="mt-2 text-red-300">Ban was applied</div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
