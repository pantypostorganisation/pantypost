// src/components/buyers/my-orders/OrdersHeader.tsx
'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, Package, Sparkles, ShieldCheck } from 'lucide-react';

export default function OrdersHeader() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Title section */}
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/15">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-200/70">
                Buyer hub
              </span>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  My Orders
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-gray-400 sm:text-base">
                Track purchases, review deliveries, and stay in sync with every seller you&apos;re supporting.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Live Tracking</p>
                <p className="text-sm font-semibold text-white">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
                <Package className="h-5 w-5 text-sky-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Fulfillment</p>
                <p className="text-sm font-semibold text-white">Secure delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15">
                <Sparkles className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">Aftercare</p>
                <p className="text-sm font-semibold text-white">Premium support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust panel */}
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-gray-300">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10">
              <ShieldCheck className="h-6 w-6 text-[#ff950e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Buyer protection enabled</p>
              <p className="text-xs text-gray-500">Encrypted payments & escrow on every transaction.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-xs text-gray-400">
            <p>
              Keep an eye on address confirmations for auction wins and leave reviews to unlock loyalty bonuses with your favourite sellers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
