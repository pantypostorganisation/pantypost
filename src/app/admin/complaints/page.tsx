// src/app/admin/complaints/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  complaintsService,
  Complaint,
  ComplaintStats,
  ComplaintStatus,
  ComplaintAction,
  MonthlyReport,
  COMPLAINT_TYPE_LABELS,
  STATUS_LABELS,
  ACTION_LABELS,
} from '@/services/complaints.service';
import {
  AlertTriangle,
  Clock3,
  ShieldCheck,
  ExternalLink,
  FileText,
  Mail,
  User as UserIcon,
  CheckCircle2,
  Loader2,
  Download,
} from 'lucide-react';

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function formatDateOnly(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

/** How long is left before the published deadline. */
function timeRemaining(dueBy?: string): { label: string; overdue: boolean } {
  if (!dueBy) return { label: '—', overdue: false };
  const diffMs = new Date(dueBy).getTime() - Date.now();
  if (diffMs < 0) {
    const days = Math.floor(Math.abs(diffMs) / 86400000);
    return { label: days >= 1 ? `${days}d overdue` : 'Overdue', overdue: true };
  }
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  return { label: days >= 1 ? `${days}d left` : `${hours}h left`, overdue: false };
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'border-red-500/50 bg-red-500/10 text-red-200',
  urgent: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  standard: 'border-white/10 bg-white/5 text-white/70',
};

const STATUS_OPTIONS: ComplaintStatus[] = [
  'received',
  'under_review',
  'escalated',
  'action_taken',
  'dismissed',
];

const ACTION_OPTIONS: ComplaintAction[] = [
  'content_removed',
  'content_restored',
  'account_suspended',
  'account_banned',
  'warning_issued',
  'no_action_required',
  'referred_to_authorities',
];

export default function AdminComplaintsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Per-complaint working state for the resolution form
  const [draftStatus, setDraftStatus] = useState<ComplaintStatus | ''>('');
  const [draftAction, setDraftAction] = useState<ComplaintAction | ''>('');
  const [draftSummary, setDraftSummary] = useState('');

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  const load = async (filter = statusFilter) => {
    setLoading(true);

    // 'open' is a convenience view rather than a stored status, so it is
    // expressed as "everything not yet concluded".
    const params: any = { limit: 100 };
    if (filter === 'overdue') {
      params.overdue = true;
    } else if (filter !== 'open' && filter !== 'all') {
      params.status = filter;
    }

    const [listRes, statsRes] = await Promise.all([
      complaintsService.getComplaints(params),
      complaintsService.getStats(),
    ]);

    if (listRes.success && listRes.data) {
      let items = listRes.data.complaints || [];
      if (filter === 'open') {
        items = items.filter(c => !['action_taken', 'dismissed'].includes(c.status));
      }
      setComplaints(items);
    }
    if (statsRes.success && statsRes.data) setStats(statsRes.data);

    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openComplaint = (c: Complaint) => {
    if (expandedId === c._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(c._id);
    setDraftStatus(c.status);
    setDraftAction(c.actionTaken || '');
    setDraftSummary(c.resolutionSummary || '');
  };

  const save = async (c: Complaint) => {
    setSavingId(c._id);

    const updates: any = {};
    if (draftStatus && draftStatus !== c.status) updates.status = draftStatus;
    if (draftAction) updates.actionTaken = draftAction;
    if (draftSummary.trim()) updates.resolutionSummary = draftSummary.trim();

    if (Object.keys(updates).length === 0) {
      toast.error('Nothing to save', 'Change the status, action or summary first.');
      setSavingId(null);
      return;
    }

    const res = await complaintsService.updateComplaint(c._id, updates);

    if (res.success) {
      toast.success('Complaint updated', `${c.referenceCode} has been updated.`);
      setExpandedId(null);
      load();
    } else {
      toast.error('Update failed', 'Please try again.');
    }

    setSavingId(null);
  };

  const generateReport = async () => {
    setLoadingReport(true);
    const now = new Date();
    // Default to the previous month, which is what gets submitted.
    const target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const res = await complaintsService.getMonthlyReport(
      target.getFullYear(),
      target.getMonth() + 1
    );
    if (res.success && res.data) setReport(res.data);
    else toast.error('Could not generate report', 'Please try again.');
    setLoadingReport(false);
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Admin access required</h1>
          <p className="text-gray-400">You need admin permissions to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4" /> Compliance
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Complaints &amp; Content Removal</h1>
            <p className="mt-1 text-sm text-gray-400">
              Every complaint carries a published commitment to respond within five business days.
            </p>
          </header>

          {/* Counters */}
          {stats && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-[#0b0b0f] p-4">
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500">Open</p>
                <p className="mt-1 text-2xl font-bold">{stats.open}</p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  stats.overdue > 0
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-white/10 bg-[#0b0b0f]'
                }`}
              >
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500">Overdue</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    stats.overdue > 0 ? 'text-red-300' : ''
                  }`}
                >
                  {stats.overdue}
                </p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  stats.urgentOpen > 0
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-white/10 bg-[#0b0b0f]'
                }`}
              >
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500">Urgent open</p>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    stats.urgentOpen > 0 ? 'text-amber-300' : ''
                  }`}
                >
                  {stats.urgentOpen}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b0b0f] p-4">
                <p className="text-[0.65rem] uppercase tracking-wider text-gray-500">All time</p>
                <p className="mt-1 text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm focus:border-[#ff950e] focus:outline-none"
            >
              <option value="open">Open</option>
              <option value="overdue">Overdue</option>
              <option value="all">All</option>
              <option value="received">Received</option>
              <option value="under_review">Under review</option>
              <option value="escalated">Escalated</option>
              <option value="action_taken">Action taken</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <button
              onClick={() => load()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:border-[#ff950e]/60 hover:text-white"
            >
              Refresh
            </button>

            <button
              onClick={generateReport}
              disabled={loadingReport}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:border-[#ff950e]/60 hover:text-white disabled:opacity-60"
            >
              {loadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Last month&apos;s compliance report
            </button>
          </div>

          {/* Monthly compliance report */}
          {report && (
            <div className="mb-8 rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#ff950e]">
                    Compliance report — {report.period}
                  </h2>
                  {report.isZeroIncidentReport && (
                    <p className="mt-1 text-sm text-emerald-300">
                      Zero incident report — no complaints received this period.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Received</p>
                  <p className="text-lg font-semibold">{report.totalReceived}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Resolved</p>
                  <p className="text-lg font-semibold">{report.resolved}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Within 5 days</p>
                  <p className="text-lg font-semibold text-emerald-300">
                    {report.resolvedWithinSla}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg resolution</p>
                  <p className="text-lg font-semibold">{report.averageResolutionHours}h</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Submit these figures to your payment processor by the 5th of the month.
              </p>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-8 text-center text-gray-400">
              Loading complaints…
            </div>
          ) : complaints.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-10 text-center text-gray-400">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500/40" />
              No complaints match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(c => {
                const remaining = timeRemaining(c.dueBy);
                const isOpen = expandedId === c._id;
                const isSaving = savingId === c._id;
                const concluded = ['action_taken', 'dismissed'].includes(c.status);

                return (
                  <div
                    key={c._id}
                    className={`rounded-xl border bg-[#0b0b0f] transition ${
                      remaining.overdue && !concluded
                        ? 'border-red-500/40'
                        : c.priority === 'critical'
                        ? 'border-red-500/30'
                        : c.priority === 'urgent'
                        ? 'border-amber-500/30'
                        : 'border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => openComplaint(c)}
                      className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm text-[#ff950e]">
                            {c.referenceCode}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                              PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.standard
                            }`}
                          >
                            {c.priority}
                          </span>
                          {c.contentRemovedOnReceipt && (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] text-emerald-200">
                              Content withdrawn
                            </span>
                          )}
                          {c.declaresDepicted && (
                            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[0.65rem] text-red-200">
                              Claims depiction
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-sm font-medium text-white">
                          {COMPLAINT_TYPE_LABELS[c.complaintType] || c.complaintType}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                          {c.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-gray-500">{STATUS_LABELS[c.status]}</p>
                          <p
                            className={`text-sm font-semibold ${
                              concluded
                                ? 'text-gray-400'
                                : remaining.overdue
                                ? 'text-red-300'
                                : 'text-gray-200'
                            }`}
                          >
                            {concluded ? 'Closed' : remaining.label}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 p-4 space-y-4">
                        {/* Detail */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-gray-400">
                              <Mail className="h-4 w-4" /> {c.complainantEmail}
                            </p>
                            {c.complainantName && (
                              <p className="flex items-center gap-2 text-gray-400">
                                <UserIcon className="h-4 w-4" /> {c.complainantName}
                              </p>
                            )}
                            {c.reportedUser && (
                              <p className="text-gray-400">
                                About user: <span className="text-white">{c.reportedUser}</span>
                              </p>
                            )}
                            {c.contentUrl && (
                              <a
                                href={c.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[#ff950e] hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" /> View reported content
                              </a>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-400">
                            <p>Received: {formatDate(c.receivedAt)}</p>
                            <p>Due by: {formatDateOnly(c.dueBy)}</p>
                            {c.resolvedAt && <p>Resolved: {formatDate(c.resolvedAt)}</p>}
                            {c.handledBy && <p>Handled by: {c.handledBy}</p>}
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                          <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">
                            Complaint
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-gray-200">
                            {c.description}
                          </p>
                        </div>

                        {/* Resolution form */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-500">
                              Status
                            </label>
                            <select
                              value={draftStatus}
                              onChange={e => setDraftStatus(e.target.value as ComplaintStatus)}
                              className="w-full rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm focus:border-[#ff950e] focus:outline-none"
                            >
                              {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-500">
                              Action taken
                            </label>
                            <select
                              value={draftAction}
                              onChange={e => setDraftAction(e.target.value as ComplaintAction)}
                              className="w-full rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm focus:border-[#ff950e] focus:outline-none"
                            >
                              <option value="">Not recorded</option>
                              {ACTION_OPTIONS.map(a => (
                                <option key={a} value={a}>
                                  {ACTION_LABELS[a]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-500">
                            Resolution summary
                          </label>
                          <textarea
                            value={draftSummary}
                            onChange={e => setDraftSummary(e.target.value.slice(0, 2000))}
                            rows={3}
                            placeholder="What did you find, and what did you do about it?"
                            className="w-full rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm placeholder:text-white/25 focus:border-[#ff950e] focus:outline-none"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Visible to the complainant when they check their reference.
                          </p>
                        </div>

                        <button
                          onClick={() => save(c)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e88800] disabled:opacity-60"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>

                        {/* Audit trail */}
                        {c.auditLog && c.auditLog.length > 0 && (
                          <div>
                            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                              <FileText className="h-3.5 w-3.5" /> Audit trail
                            </p>
                            <div className="space-y-1.5">
                              {c.auditLog.map((entry, i) => (
                                <div
                                  key={i}
                                  className="rounded border border-white/5 bg-black/40 px-3 py-2 text-xs"
                                >
                                  <span className="text-gray-500">{formatDate(entry.at)}</span>
                                  {' · '}
                                  <span className="text-gray-300">{entry.by}</span>
                                  {' · '}
                                  <span className="text-white">{entry.action}</span>
                                  {entry.note && (
                                    <p className="mt-0.5 text-gray-400">{entry.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}