// src/components/buyers/my-orders/EmptyOrdersState.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MessageCircle } from 'lucide-react';

export default function EmptyOrdersState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 px-8 py-16 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-black/40">
          <Package className="h-12 w-12 text-white/40" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-semibold text-white">You haven&apos;t placed any orders yet</h3>
          <p className="text-base text-gray-400">
            Discover verified sellers, browse curated drops, or send a custom request to get something made just for you.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ff950e] px-8 py-3 text-base font-semibold text-black transition-colors hover:bg-[#ff7a00]"
          >
            <Package className="h-5 w-5" />
            Explore listings
          </Link>

          <Link
            href="/buyers/messages"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-5 w-5" />
            Send a custom request
          </Link>
        </div>
      </div>
    </div>
  );
}
