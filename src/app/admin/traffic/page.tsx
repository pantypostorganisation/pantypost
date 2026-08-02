// src/app/admin/traffic/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import {
  trafficService,
  TrafficReport,
  TrafficEvents,
  TopEntry,
} from '@/services/traffic.service';
import {
  BarChart3,
  Users,
  Eye,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Search,
} from 'lucide-react';

const RANGES = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

/** Period-on-period delta. Neutral styling at zero, so a flat week
    doesn't read as either good or bad. */
function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-ink-faint">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }

  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs ${
        positive ? 'text-success' : 'text-danger'
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-faint">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {change !== undefined && <Delta value={change} />}
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none text-ink">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

/** Horizontal bars, proportional to the largest value in the list. */
function TopList({
  title,
  entries,
  empty,
  formatKey,
}: {
  title: string;
  entries: TopEntry[];
  empty: string;
  formatKey?: (key: string) => string;
}) {
  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4">
      <h2 className="mb-3 text-sm font-medium text-ink">{title}</h2>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-xs text-ink-faint">{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div key={entry.key} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded bg-primary-soft"
                style={{ width: `${(entry.count / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between px-2 py-1.5">
                <span className="truncate text-xs text-ink-muted">
                  {formatKey ? formatKey(entry.key) : entry.key}
                </span>
                <span className="ml-3 shrink-0 text-xs font-medium text-ink">
                  {entry.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Minimal column chart. Recharts is available but overkill for a
    single series, and this keeps the page light. */
function TrendChart({ series }: { series: TrafficReport['series'] }) {
  const max = Math.max(...series.map((p) => p.pageviews), 1);

  if (series.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface-raised p-8 text-center">
        <p className="text-sm text-ink-faint">No traffic recorded in this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4">
      <h2 className="mb-4 text-sm font-medium text-ink">Pageviews</h2>

      <div className="flex h-40 items-end gap-1">
        {series.map((point) => (
          <div key={point.date} className="group relative flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: `${Math.max((point.pageviews / max) * 100, 2)}%` }}
            />
            {/* Tooltip sits inside the container so it cannot be clipped. */}
            <div className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded border border-line-strong bg-surface-overlay px-2 py-1 text-xs text-ink shadow-overlay group-hover:block">
              {point.pageviews} views · {point.visitors} visitors
              <span className="block text-ink-faint">{point.date}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-xs text-ink-faint">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function AdminTrafficPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<TrafficReport | null>(null);
  const [events, setEvents] = useState<TrafficEvents | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([trafficService.getReport(days), trafficService.getEvents(days)]).then(
      ([reportRes, eventsRes]) => {
        if (cancelled) return;
        if (reportRes.success && reportRes.data) setReport(reportRes.data);
        if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isAdmin, days]);

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-4 text-ink">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-ink-muted">You need admin permissions to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-surface text-ink">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-faint">
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Traffic</h1>
            </div>

            <div className="flex rounded-md border border-line bg-surface-raised p-1">
              {RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setDays(range.days)}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    days === range.days
                      ? 'bg-surface-hover font-medium text-ink'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
            <div className="grid place-items-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !report ? (
            <div className="rounded-lg border border-line bg-surface-raised p-10 text-center">
              <p className="text-sm text-ink-muted">Could not load traffic data.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={Eye}
                  label="Pageviews"
                  value={report.summary.pageviews.toLocaleString()}
                  change={report.change.pageviews}
                />
                <StatCard
                  icon={Users}
                  label="Visitors"
                  value={report.summary.visitors.toLocaleString()}
                  change={report.change.visitors}
                  hint="Unique per day"
                />
                <StatCard
                  icon={MousePointerClick}
                  label="Sessions"
                  value={report.summary.sessions.toLocaleString()}
                  change={report.change.sessions}
                />
                <StatCard
                  icon={BarChart3}
                  label="Views / session"
                  value={report.summary.viewsPerSession}
                  hint={`${report.summary.signedInViews.toLocaleString()} signed in · ${report.summary.guestViews.toLocaleString()} guest`}
                />
              </div>

              <TrendChart series={report.series} />

              <div className="grid gap-4 lg:grid-cols-2">
                <TopList
                  title="Top pages"
                  entries={report.topPages}
                  empty="No pageviews yet."
                />
                <TopList
                  title="Referrers"
                  entries={report.topReferrers}
                  empty="No referral data yet."
                />
                <TopList
                  title="Devices"
                  entries={report.devices}
                  empty="No device data yet."
                  formatKey={(k) => k.charAt(0).toUpperCase() + k.slice(1)}
                />
                <TopList
                  title="Countries"
                  entries={report.countries}
                  empty="No country data. This requires a CDN that provides geo headers."
                />
              </div>

              {events && (events.searches.length > 0 || events.events.length > 0) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-line bg-surface-raised p-4">
                    <h2 className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                      <Search className="h-3.5 w-3.5" /> Search terms
                    </h2>
                    {events.searches.length === 0 ? (
                      <p className="py-6 text-center text-xs text-ink-faint">
                        No searches recorded.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {events.searches.map((s) => (
                          <div
                            key={s.term}
                            className="flex items-center justify-between px-2 py-1.5 text-xs"
                          >
                            <span className="truncate text-ink-muted">{s.term}</span>
                            <span className="ml-3 shrink-0 font-medium text-ink">
                              {s.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <TopList
                    title="Interactions"
                    entries={events.events.map((e) => ({
                      key: `${e.action} · ${e.category}`,
                      count: e.count,
                    }))}
                    empty="No interactions recorded."
                  />
                </div>
              )}

              <p className="pt-2 text-center text-xs text-ink-faint">
                First-party analytics. No IP addresses or user agents are stored, and records
                are deleted automatically after 90 days.
              </p>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}