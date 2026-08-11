// src/components/wallet/buyer/TotalSpentCard.tsx
'use client';

import { ShoppingBag } from 'lucide-react';

interface TotalSpentCardProps {
  totalSpent: number;
  totalOrders: number;
}

export default function TotalSpentCard({ totalSpent, totalOrders }: TotalSpentCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-8 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-ink-muted mb-1">Total Spent</h2>
            <p className="text-xs text-ink-faint">Lifetime purchases</p>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</span>
          <span className="ml-2 text-sm text-ink-muted">USD</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-faint">Total Orders</span>
          <span className="font-semibold text-ink-muted">{totalOrders}</span>
        </div>

        {totalOrders > 0 && (
          <div className="mt-4 pt-4 border-t border-line">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-faint">Avg. per order</span>
              <span className="text-ink-muted">${(totalSpent / totalOrders).toFixed(2)}</span>
            </div>
          </div>
        )}
    </div>
  );
}