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
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Search,
  Globe,
  Smartphone,
  FileText,
  ExternalLink,
  Activity,
  Shield,
} from 'lucide-react';

const RANGES = [
  { days: 1, label: '24h' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

/* Period-on-period delta. Neutral at zero, so a flat week reads as
   neither good nor bad. */
function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  }

  const up = value > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        up ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  change,
  sub,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
  change?: number;
  sub?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${iconBg} rounded-xl`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {change !== undefined && <Delta value={change} />}
      </div>
      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

/* Ranked list with proportional bars behind each row. */
function TopList({
  icon: Icon,
  iconColor,
  title,
  entries,
  empty,
  formatKey,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  entries: TopEntry[];
  empty: string;
  formatKey?: (key: string) => string;
}) {
  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">{empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={`${entry.key}-${index}`}
              className="relative bg-black/30 rounded-lg overflow-hidden hover:bg-black/50 transition-colors"
            >
              {/* Proportional fill sits behind the row rather than beside
                  it, so the list stays scannable at a glance. */}
              <div
                className="absolute inset-y-0 left-0 bg-[#ff950e]/10"
                style={{ width: `${(entry.count / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-gray-600 w-4 shrink-0">{index + 1}</span>
                  <span className="text-sm text-gray-300 truncate">
                    {formatKey ? formatKey(entry.key) : entry.key}
                  </span>
                </div>
                <span className="text-sm font-bold text-white ml-3 shrink-0">
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

function TrendChart({ series }: { series: TrafficReport['series'] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...series.map((p) => p.pageviews), 1);
  const totalViews = series.reduce((sum, p) => sum + p.pageviews, 0);
  const peak = series.reduce(
    (best, p) => (p.pageviews > best.pageviews ? p : best),
    series[0] || { date: '', pageviews: 0, visitors: 0 }
  );
  const average = series.length ? Math.round(totalViews / series.length) : 0;

  if (series.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-[#ff950e]" />
          <h3 className="text-lg font-bold text-white">Traffic Trend</h3>
        </div>
        <div className="py-16 text-center">
          <Activity className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No traffic recorded in this period yet.</p>
          <p className="text-xs text-gray-600 mt-1">
            Data appears as visitors browse the site.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#ff950e]" />
          <h3 className="text-lg font-bold text-white">Traffic Trend</h3>
        </div>
        <span className="text-sm text-gray-500">Pageviews per day</span>
      </div>

      {/* h-80 rather than h-64: the hover tooltip sits above the tallest
          bar and was being clipped at the shorter height. Bar scaling is
          unchanged. */}
      <div className="relative h-80">
        <div className="absolute inset-x-3 bottom-3 top-6 flex items-end justify-between gap-1.5">
          {series.map((point, index) => {
            const heightPx = Math.max((point.pageviews / max) * 200, 4);
            const isPeak = point.pageviews === peak.pageviews && point.pageviews > 0;

            return (
              <div
                key={point.date}
                className="flex flex-col items-center gap-3 flex-1 min-w-0"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="relative flex w-full justify-center">
                  {hovered === index && (
                    <div className="absolute -top-9 z-10 whitespace-nowrap rounded-lg border border-gray-700 bg-black px-2.5 py-1.5 text-xs shadow-xl">
                      <span className="font-bold text-white">
                        {point.pageviews.toLocaleString()}
                      </span>
                      <span className="text-gray-400"> views · </span>
                      <span className="text-gray-300">{point.visitors}</span>
                      <span className="text-gray-400"> visitors</span>
                    </div>
                  )}
                  <div
                    className={`w-full max-w-[42px] rounded-t-lg transition-all duration-200 ${
                      isPeak
                        ? 'bg-gradient-to-t from-[#ff950e] to-[#ffb347]'
                        : 'bg-gradient-to-t from-[#ff950e] to-[#ff6b00]'
                    } ${hovered === index ? 'opacity-100' : 'opacity-80'}`}
                    style={{ height: `${heightPx}px` }}
                  />
                </div>
                <span className="origin-top -rotate-45 whitespace-nowrap text-[10px] text-gray-500">
                  {new Date(point.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-800 pt-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500">Peak Day</p>
          <p className="mt-1 text-lg font-bold text-green-400">
            {peak.pageviews.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500">Daily Average</p>
          <p className="mt-1 text-lg font-bold text-white">{average.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
          <p className="mt-1 text-lg font-bold text-[#ff950e]">
            {totalViews.toLocaleString()}
          </p>
        </div>
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
          <p className="text-gray-400">You need admin permissions to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header, matching the wallet admin treatment */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#ff950e] to-[#ff6b00] p-3 rounded-xl">
                <BarChart3 className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Site Traffic</h1>
                <p className="text-gray-400 mt-1">Visitor activity across the platform</p>
              </div>
            </div>

            <div className="flex bg-black/40 border border-gray-800 rounded-xl p-1">
              {RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setDays(range.days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    days === range.days
                      ? 'bg-[#ff950e] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-[#ff950e]" />
            </div>
          ) : !report ? (
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-12 text-center">
              <p className="text-gray-400">Could not load traffic data.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Eye}
                  iconColor="text-[#ff950e]"
                  iconBg="bg-[#ff950e]/10"
                  label="Pageviews"
                  value={report.summary.pageviews.toLocaleString()}
                  change={report.change.pageviews}
                />
                <StatCard
                  icon={Users}
                  iconColor="text-blue-400"
                  iconBg="bg-blue-500/10"
                  label="Visitors"
                  value={report.summary.visitors.toLocaleString()}
                  change={report.change.visitors}
                  sub="Unique per day"
                />
                <StatCard
                  icon={MousePointerClick}
                  iconColor="text-purple-400"
                  iconBg="bg-purple-500/10"
                  label="Sessions"
                  value={report.summary.sessions.toLocaleString()}
                  change={report.change.sessions}
                />
                <StatCard
                  icon={Activity}
                  iconColor="text-green-400"
                  iconBg="bg-green-500/10"
                  label="Views / Session"
                  value={report.summary.viewsPerSession}
                  sub={`${report.summary.signedInViews.toLocaleString()} signed in · ${report.summary.guestViews.toLocaleString()} guest`}
                />
              </div>

              <TrendChart series={report.series} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopList
                  icon={FileText}
                  iconColor="text-[#ff950e]"
                  title="Top Pages"
                  entries={report.topPages}
                  empty="No pageviews recorded yet."
                />
                <TopList
                  icon={ExternalLink}
                  iconColor="text-blue-400"
                  title="Traffic Sources"
                  entries={report.topReferrers}
                  empty="No referral data yet."
                />
                <TopList
                  icon={Smartphone}
                  iconColor="text-purple-400"
                  title="Devices"
                  entries={report.devices}
                  empty="No device data yet."
                  formatKey={(k) => k.charAt(0).toUpperCase() + k.slice(1)}
                />
                <TopList
                  icon={Globe}
                  iconColor="text-green-400"
                  title="Countries"
                  entries={report.countries}
                  empty="Requires a CDN that provides geo headers."
                />
              </div>

              {events && (events.searches.length > 0 || events.events.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TopList
                    icon={Search}
                    iconColor="text-[#ff950e]"
                    title="Search Terms"
                    entries={events.searches.map((s) => ({ key: s.term, count: s.count }))}
                    empty="No searches recorded."
                  />
                  <TopList
                    icon={MousePointerClick}
                    iconColor="text-blue-400"
                    title="Interactions"
                    entries={events.events.map((e) => ({
                      key: `${e.action} · ${e.category}`,
                      count: e.count,
                    }))}
                    empty="No interactions recorded."
                  />
                </div>
              )}

              {/* Privacy note. Worth stating on-screen, since this is the
                  page where someone would ask what we actually collect. */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Shield className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">First-party analytics</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Collected on our own infrastructure. No IP addresses, user agents or
                      full referrer URLs are stored, and all records are deleted
                      automatically after 90 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}