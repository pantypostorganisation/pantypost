// src/components/wallet/buyer/RecentPurchases.tsx
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
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
              <ShoppingBag className="h-5 w-5 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Recent Purchases</h2>
              <p className="text-sm text-gray-400">A snapshot of your latest checkouts across the marketplace.</p>
            </div>
          </div>

          <a
            href="/buyers/my-orders"
            className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-[#0c0c0c] px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-[#ff950e] hover:text-white"
          >
            View all orders
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="space-y-4">
          {purchases.map((purchase, index) => (
            <div
              key={index}
              className="group/item rounded-2xl border border-gray-800 bg-[#0c0c0c] p-5 transition-colors duration-200 hover:border-[#ff950e]/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff950e]/40 bg-[#ff950e]/10">
                    <Package className="h-5 w-5 text-[#ff950e]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h3 className="text-base font-semibold text-white transition-colors group-hover/item:text-[#ff950e]">
                        {purchase.title}
                      </h3>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 px-2.5 py-1 text-[11px] uppercase tracking-widest text-[#ff950e]">
                        <Shield className="h-3.5 w-3.5 text-[#ff950e]" />
                        Secure transaction
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
                  <p className="text-xl font-semibold text-[#ff950e]">
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
