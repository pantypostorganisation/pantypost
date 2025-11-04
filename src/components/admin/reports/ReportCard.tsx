// src/components/admin/reports/ReportCard.tsx
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
  
  // Get severity color and icon
  const getSeverityInfo = (severity: ReportCardProps['report']['severity']) => {
    if (!severity) {
      return {
        chipClasses: 'border border-zinc-700 bg-transparent text-zinc-400',
        icon: Info,
        label: 'Unknown'
      };
    }

    switch (severity) {
      case 'low':
        return {
          chipClasses: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
          icon: Activity,
          label: 'Low'
        };
      case 'medium':
        return {
          chipClasses: 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
          icon: AlertCircle,
          label: 'Medium'
        };
      case 'high':
        return {
          chipClasses: 'border border-orange-500/30 bg-orange-500/10 text-orange-300',
          icon: AlertTriangle,
          label: 'High'
        };
      case 'critical':
        return {
          chipClasses: 'border border-red-500/40 bg-red-500/10 text-red-300',
          icon: ShieldAlert,
          label: 'Critical'
        };
      default:
        return {
          chipClasses: 'border border-zinc-700 bg-transparent text-zinc-400',
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

  const severityInfo = getSeverityInfo(report.severity);
  const CategoryIcon = getCategoryIcon(report.category);

  // Ensure stats are valid numbers
  const safeStats = {
    totalReports: Math.max(0, Number(userStats?.totalReports) || 0),
    activeReports: Math.max(0, Number(userStats?.activeReports) || 0)
  };

  return (
    <div className="rounded-2xl border border-zinc-900/70 bg-zinc-950/80 shadow-none">
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 flex-col gap-3 text-left transition-colors hover:text-white"
          >
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-2 text-base font-semibold text-white">
                <User size={16} className="text-zinc-500" />
                <span>
                  <SecureMessageDisplay
                    content={report.reporter}
                    allowBasicFormatting={false}
                    className="inline"
                  />
                  {' → '}
                  <SecureMessageDisplay
                    content={report.reportee}
                    allowBasicFormatting={false}
                    className="inline"
                  />
                </span>
              </span>

              {userBanInfo && (
                <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-red-300">
                  Banned
                </span>
              )}

              {report.processed && (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
                  Processed
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] ${severityInfo.chipClasses}`}>
                <severityInfo.icon size={12} />
                {severityInfo.label}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2.5 py-1 text-[0.7rem] text-zinc-400">
                <CategoryIcon size={12} />
                {report.category || 'uncategorized'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2.5 py-1 text-[0.7rem] text-zinc-400">
                <Activity size={12} />
                {new Date(report.date).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2.5 py-1">
                <Users size={12} />
                {safeStats.totalReports} total reports
              </span>
              {safeStats.activeReports > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-2.5 py-1 text-red-300">
                  {safeStats.activeReports} active
                </span>
              )}
              {userBanInfo?.reason && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-2.5 py-1 text-red-300">
                  <ShieldAlert size={12} />
                  {userBanInfo.reason}
                </span>
              )}
            </div>
          </button>

          <div className="flex flex-col items-stretch gap-3 md:items-end">
            {!report.processed && (
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBan();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                  disabled={!banContext}
                >
                  <Ban size={14} />
                  Ban
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/80 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <CheckCircle size={14} />
                  Resolve
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <Trash2 size={14} />
              Delete
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center justify-end gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-white"
            >
              <MessageSquare size={14} />
              {Array.isArray(report.messages) ? report.messages.length : 0} messages
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <ReportDetails
            report={report}
            userStats={userStats}
            onUpdateSeverity={onUpdateSeverity}
            onUpdateCategory={onUpdateCategory}
            onUpdateAdminNotes={onUpdateAdminNotes}
          />
        )}
      </div>
    </div>
  );
}
