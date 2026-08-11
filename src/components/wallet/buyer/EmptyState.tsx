// src/components/wallet/buyer/EmptyState.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function EmptyState() {
  return (
    <section className="rounded-lg border border-dashed border-line bg-surface p-12 text-center">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-semibold text-white">No purchases just yet</h3>
          <p className="text-sm text-ink-muted sm:text-base">
            Unlock the full buyer experience by topping up and discovering curated drops from trusted sellers.
          </p>
        </div>
        <a
          href="/browse"
          className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-primary-press"
        >
          Browse listings
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}