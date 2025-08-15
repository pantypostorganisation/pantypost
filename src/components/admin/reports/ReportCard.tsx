'use client';

import { useState } from 'react';
import {
  User,
  Users,
  CheckCircle,
  Ban,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageSquare,
  EyeOff,
  ShieldAlert,
  Flag,
  Activity,
  AlertCircle,
  Info
} from 'lucide-react';
import { ReportCardProps } from './types';
import ReportDetails from './ReportDetails';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { coerceReport } from '@/utils/validation/report.schemas';

// Safe date display (avoids crashes on bad/unknown input)
function toSafeLocaleString(value: unknown): string {
  const d = value instanceof Date ? value : new Date(value as any);
  const valid = !isNaN(d.getTime());
  return valid ? d.toLocaleString() : 'Unknown date';
}

export default function ReportCard({
  report,
  isExpanded,
  onToggle,
  onBan,
  onResolve,
  onDelete,
  onUpdateSeverity,
  onUpdateCategory,
  onUpdateAdminNotes,
  userStats,
  userBanInfo,
  banContext
}: ReportCardProps) {

  // Validate & sanitize report object at the boundary
  const safeReport = coerceReport(report);

  // Get severity color and icon
  const getSeverityInfo = (severity: ReportCardProps['report']['severity']) => {
    if (!severity) {
      return {
        color: 'text-gray-400 bg-gray-900/20',
        icon: Info,
        label: 'Unknown'
      };
    }

    switch (severity) {
      case 'low':
        return {
          color: 'text-green-400 bg-green-900/20',
          icon: Activity,
          label: 'Low'
        };
      case 'medium':
        return {
          color: 'text-yellow-400 bg-yellow-900/20',
          icon: AlertCircle,
          label: 'Medium'
        };
      case 'high':
        return {
          color: 'text-orange-400 bg-orange-900/20',
          icon: AlertTriangle,
          label: 'High'
        };
      case 'critical':
        return {
          color: 'text-red-400 bg-red-900/20',
          icon: ShieldAlert,
          label: 'Critical'
        };
      default:
        return {
          color: 'text-gray-400 bg-gray-900/20',
          icon: Info,
          label: 'Unknown'
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: ReportCardProps['report']['category']) => {
    switch (category) {
      case 'harassment': return AlertTriangle;
      case 'spam': return MessageSquare;
      case 'inappropriate_content': return EyeOff;
      case 'scam': return ShieldAlert;
      default: return Flag;
    }
  };

  const severityInfo = getSeverityInfo(
    safeReport.severity as ReportCardProps['report']['severity']
  );
  const CategoryIcon = getCategoryIcon(
    safeReport.category as ReportCardProps['report']['category']
  );

  // Ensure stats are valid numbers
  const safeStats = {
    totalReports: Math.max(0, Number(userStats?.totalReports) || 0),
    activeReports: Math.max(0, Number(userStats?.activeReports) || 0)
  };

  const processed = !!safeReport.processed;
  const messagesCount = Array.isArray(safeReport.messages) ? safeReport.messages.length : 0;

  return (
    <div
      className={`bg-[#1a1a1a] border ${
        safeReport.severity === 'critical' ? 'border-red-800' :
        safeReport.severity === 'high' ? 'border-orange-800' :
        'border-gray-800'
      } rounded-lg overflow-hidden hover:border-gray-700 transition-all`}
    >
      {/* Report Header - Clickable */}
      <div
        className="p-6 cursor-pointer"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
        aria-label="Toggle report details"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" aria-hidden="true" />
                <span className="font-semibold text-white">
                  <SecureMessageDisplay
                    content={safeReport.reporter}
                    allowBasicFormatting={false}
                    className="inline"
                  />
                  {' → '}
                  <SecureMessageDisplay
                    content={safeReport.reportee}
                    allowBasicFormatting={false}
                    className="inline"
                  />
                </span>
              </div>

              {/* Status Badges */}
              {userBanInfo && (
                <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                  BANNED
                </span>
              )}

              {/* User Report History - Simple Count */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-900/20 text-purple-400 text-xs rounded font-medium flex items-center gap-1">
                  <Users size={12} aria-hidden="true" />
                  {safeStats.totalReports} Total Reports
                </span>
                {safeStats.activeReports > 0 && (
                  <span className="px-2 py-1 bg-red-900/20 text-red-400 text-xs rounded font-medium">
                    {safeStats.activeReports} Active
                  </span>
                )}
              </div>

              {processed && (
                <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded font-medium">
                  PROCESSED
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{toSafeLocaleString(safeReport.date)}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${severityInfo.color}`}>
                <severityInfo.icon size={12} aria-hidden="true" />
                {severityInfo.label}
              </span>
              <span className="flex items-center gap-1">
                <CategoryIcon size={12} aria-hidden="true" />
                {safeReport.category || 'uncategorized'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Buttons - Only when not processed */}
            {!processed && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Custom Ban */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBan();
                  }}
                  className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-800 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!banContext}
                  aria-disabled={!banContext}
                  aria-label="Custom ban"
                >
                  <Ban size={12} className="mr-1" aria-hidden="true" />
                  Custom Ban
                </button>

                {/* Resolve without ban */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center transition-colors"
                  aria-label="Resolve report without ban"
                >
                  <CheckCircle size={12} className="mr-1" aria-hidden="true" />
                  Resolve (No Ban)
                </button>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-3 py-1 bg-red-800 text-white text-sm rounded hover:bg-red-900 flex items-center transition-colors"
              aria-label="Delete report"
            >
              <Trash2 size={12} className="mr-1" aria-hidden="true" />
              Delete
            </button>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-sm">
                {messagesCount} messages
              </span>
              {isExpanded ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <ReportDetails
          report={safeReport as unknown as ReportCardProps['report']}
          userStats={userStats}
          onUpdateSeverity={onUpdateSeverity}
          onUpdateCategory={onUpdateCategory}
          onUpdateAdminNotes={onUpdateAdminNotes}
        />
      )}
    </div>
  );
}
