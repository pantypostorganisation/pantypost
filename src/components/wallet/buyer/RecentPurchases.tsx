'use client';

import { ShoppingBag, ArrowRight, Package, Calendar, Shield } from 'lucide-react';
import { Order } from '@/context/WalletContext';

interface RecentPurchasesProps {
  purchases: Order[];
}

export default function RecentPurchases({ purchases }: RecentPurchasesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (purchases.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_40px_120px_-70px_rgba(168,85,247,0.6)] transition-colors hover:border-white/20 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/40 bg-purple-500/20">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent Purchases</h2>
              <p className="text-sm text-gray-400">A snapshot of your latest checkouts across the marketplace.</p>
            </div>
          </div>

          <a
            href="/buyers/my-orders"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:border-blue-400/40 hover:bg-black/60 hover:text-white"
          >
            View all orders
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="space-y-4">
          {purchases.map((purchase, index) => (
            <div
              key={index}
              className="group/item relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 transition-all duration-200 hover:border-purple-400/40 hover:bg-black/60"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100" aria-hidden="true">
                <div className="h-full w-full bg-gradient-to-r from-purple-500/10 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/40 bg-purple-500/15">
                    <Package className="h-5 w-5 text-purple-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h3 className="text-base font-semibold text-white transition-colors group-hover/item:text-sky-200">
                        {purchase.title}
                      </h3>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-widest text-gray-400">
                        <Shield className="h-3.5 w-3.5 text-purple-200" />
                        Protected
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                      <span className="font-medium text-white/80">Seller: {purchase.seller}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(purchase.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <p className="text-xl font-semibold text-sky-200">
                    ${(purchase.markedUpPrice ?? purchase.price).toFixed(2)}
                  </p>
                  <span className="text-xs uppercase tracking-widest text-gray-500">Paid in wallet</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
