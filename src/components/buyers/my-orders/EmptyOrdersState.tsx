// src/components/buyers/my-orders/EmptyOrdersState.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MessageCircle } from 'lucide-react';

export default function EmptyOrdersState() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] via-black/40 to-black/60 px-8 py-16 text-center shadow-[0_30px_90px_-50px_rgba(255,149,14,0.5)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.18),_transparent_60%)]" />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-black/40">
          <Package className="h-12 w-12 text-white/40" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-semibold text-white">You haven't placed any orders yet</h3>
          <p className="text-base text-gray-400">
            Discover verified sellers, browse curated drops, or send a custom request to get something made just for you.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff950e] to-[#ff7a00] px-8 py-3 text-base font-semibold text-black shadow-[0_18px_45px_-25px_rgba(255,149,14,0.8)] transition-transform hover:-translate-y-0.5"
          >
            <Package className="h-5 w-5" />
            Explore listings
          </Link>

          <Link
            href="/buyers/messages"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            <MessageCircle className="h-5 w-5" />
            Send a custom request
          </Link>
        </div>
      </div>
    </div>
  );
}
