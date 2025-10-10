'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function EmptyState() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-dashed border-white/20 bg-white/[0.015] p-12 text-center shadow-[0_40px_120px_-70px_rgba(255,149,14,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,149,14,0.12),transparent_60%)]" />
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#ff950e]/40 bg-[#ff950e]/15 shadow-[0_12px_40px_-20px_rgba(255,149,14,0.6)]">
          <ShoppingBag className="h-10 w-10 text-[#ffb347]" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-semibold text-white">No purchases just yet</h3>
          <p className="text-sm text-gray-400 sm:text-base">
            Unlock the full buyer experience by topping up and discovering curated drops from trusted sellers.
          </p>
        </div>
        <a
          href="/browse"
          className="group inline-flex items-center gap-2 rounded-full border border-[#ff950e]/50 bg-[#ff950e] px-6 py-3 text-sm font-semibold text-black transition-transform duration-300 hover:scale-105 hover:border-[#ffb347]/70"
        >
          Browse listings
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
