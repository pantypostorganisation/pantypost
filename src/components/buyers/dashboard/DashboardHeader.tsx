// src/components/buyers/dashboard/DashboardHeader.tsx
'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface DashboardHeaderProps {
  username: string;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-xl">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Buyer dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
            Welcome back,
            <span className="ml-2 inline-flex rounded-full bg-orange-400/20 px-3 py-1 text-lg font-medium text-orange-200">
              <SecureMessageDisplay content={username} allowBasicFormatting={false} className="inline" />
            </span>
          </h1>
          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            Review your latest orders, stay close to favourite sellers, and keep your wallet ready for the next drop.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
          >
            Explore marketplace
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-slate-400">Stay active to unlock premium drops from verified sellers.</p>
        </div>
      </div>
    </section>
  );
}
