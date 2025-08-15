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
    <div className="border-t border-gray-800 p-6 space-y-4 bg-[#0a0a0a]">
      {/* User Report History - Simple Statistics */}
      <div className="p-3 bg-purple-900/10 border border-purple-800 rounded-lg">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <BarChart3 size={16} />
          <span className="font-medium">Report Summary for {sanitizeStrict(report.reportee)}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total Reports:</span>
            <span className="text-white ml-2 font-medium">{stats.totalReports}</span>
          </div>
          <div>
            <span className="text-gray-400">Active Reports:</span>
            <span className="text-red-400 ml-2 font-medium">{stats.activeReports}</span>
          </div>
          <div>
            <span className="text-gray-400">Processed Reports:</span>
            <span className="text-green-400 ml-2 font-medium">{stats.processedReports}</span>
          </div>
        </div>

        {userStats.isBanned && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded">
            <div className="text-red-400 text-sm font-medium">Currently Banned</div>
            <div className="text-gray-300 text-xs">
              {remainingText}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div>
        <div className="text-sm text-gray-400 mb-2 flex items-center gap-1">
          <MessageSquare size={14} />
          Conversation ({report.messages?.length || 0} messages)
        </div>
        <div className="bg-[#111] rounded-lg max-h-64 overflow-y-auto p-3 space-y-2">
          {report.messages && report.messages.length > 0 ? (
            report.messages.map((msg, idx) => (
              <div
                key={`${msg.sender}-${msg.date}-${idx}`}
                className={`p-2 rounded text-sm ${
                  msg.sender === report.reporter
                    ? 'bg-blue-900/20 text-blue-300'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <div className="font-semibold">{sanitizeStrict(msg.sender)}</div>
                <div className="text-xs text-gray-500">
                  {new Date(msg.date).toLocaleString()}
                </div>
                <SecureMessageDisplay
                  content={msg.content}
                  className="mt-1"
                  allowBasicFormatting={false}
                  maxLength={500}
                />
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">No messages available</div>
          )}
        </div>
      </div>

      {/* Severity and Category Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="severity-select" className="block text-sm font-medium text-gray-300 mb-1">Severity</label>
          <select
            id="severity-select"
            aria-label="Set report severity"
            value={SEVERITIES.includes((report.severity as any)) ? report.severity : 'medium'}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          >
            {SEVERITIES.map(s => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            id="category-select"
            aria-label="Set report category"
            value={CATEGORIES.includes((report.category as any)) ? report.category : 'other'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#222] border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Admin Notes</span>
          <span className="text-xs text-gray-500">(Auto-saves)</span>
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
        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm">
          <div className="text-gray-400">
            Processed by: <span className="text-white">{sanitizeStrict(report.processedBy || 'Unknown')}</span>
          </div>
          {report.processedAt && (
            <div className="text-gray-400">
              Processed at: <span className="text-white">{new Date(report.processedAt).toLocaleString()}</span>
            </div>
          )}
          {report.banApplied && (
            <div className="text-red-400 mt-1">Ban was applied</div>
          )}
        </div>
      )}
    </div>
  );
}
