// src/components/admin/verification/VerificationStats.tsx
'use client';

import { useMemo } from 'react';
import { FileCheck, Clock, Calendar, Timer } from 'lucide-react';
import type { VerificationStatsProps } from '@/types/verification';

export default function VerificationStats({ stats }: VerificationStatsProps) {
  const safeNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  const totals = useMemo(() => ({
    total: safeNumber(stats?.total),
    today: safeNumber(stats?.today),
    thisWeek: safeNumber(stats?.thisWeek),
    avgHours: safeNumber(stats?.averageProcessingTime)
  }), [stats]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-2xl border border-white/5 bg-black/40 p-5 transition hover:border-[#ff950e]/50">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/40">Total</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff950e]/40 bg-[#ff950e]/15 text-[#ff950e]">
              <FileCheck className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-white">{totals.total}</p>
          <p className="mt-2 text-sm text-white/50">Pending verifications</p>
        </div>

        <div className="group rounded-2xl border border-white/5 bg-black/40 p-5 transition hover:border-sky-400/60">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/40">Today</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-400/10 text-sky-400">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-sky-300">{totals.today}</p>
          <p className="mt-2 text-sm text-white/50">Requests received</p>
        </div>

        <div className="group rounded-2xl border border-white/5 bg-black/40 p-5 transition hover:border-purple-400/60">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/40">This week</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-400/10 text-purple-300">
              <Calendar className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-purple-200">{totals.thisWeek}</p>
          <p className="mt-2 text-sm text-white/50">Submitted in the last 7 days</p>
        </div>

        <div className="group rounded-2xl border border-white/5 bg-black/40 p-5 transition hover:border-emerald-400/60">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/40">Average time</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
              <Timer className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-3xl font-semibold text-emerald-200">
            {totals.avgHours}
            <span className="ml-1 text-base font-medium text-emerald-200/70">h</span>
          </p>
          <p className="mt-2 text-sm text-white/50">To approve or reject</p>
        </div>
      </div>
    </section>
  );
}
