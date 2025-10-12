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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/90 px-8 py-10 shadow-[0_20px_60px_-30px_rgba(255,149,14,0.45)]">
      <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#ff950e]/10 blur-3xl" aria-hidden />
      <div className="absolute -right-10 -bottom-16 h-56 w-56 rounded-full bg-[#ff6b00]/5 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">Buyer dashboard</p>
          <div>
            <p className="text-sm text-gray-400">Welcome back</p>
            <h1 className="mt-1 text-3xl font-semibold text-white sm:text-4xl">
              <SecureMessageDisplay content={username} allowBasicFormatting={false} className="inline" />
            </h1>
          </div>
          <p className="max-w-xl text-sm text-gray-400 sm:text-base">
            Monitor orders, discover new drops, and stay close to the creators you trust most.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-5 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-[#ff950e]/30"
          >
            <span className="text-black">Explore marketplace</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-gray-500">New drops land daily. Keep your wallet ready.</p>
        </div>
      </div>
    </section>
  );
}
