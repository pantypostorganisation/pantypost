// src/components/buyers/dashboard/QuickActions.tsx
'use client';

import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Package, ShoppingBag, Wallet } from 'lucide-react';
import { QuickActionsProps } from '@/types/dashboard';

const ACTIONS = [
  {
    title: 'Browse marketplace',
    description: 'Curated listings tailored to your preferences.',
    href: '/browse',
    tone: 'bg-orange-500/15 text-orange-200',
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    title: 'Messages',
    description: 'Continue conversations with trusted sellers.',
    href: '/buyers/messages',
    tone: 'bg-blue-500/15 text-blue-200',
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    title: 'Track orders',
    description: 'Follow fulfilment progress and delivery updates.',
    href: '/buyers/my-orders',
    tone: 'bg-purple-500/15 text-purple-200',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Wallet',
    description: 'Manage balance, deposits, and payouts.',
    href: '/wallet/buyer',
    tone: 'bg-emerald-500/15 text-emerald-200',
    icon: <Wallet className="h-4 w-4" />,
  },
];

export default function QuickActions({}: QuickActionsProps) {
  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="quick-actions-heading" className="text-sm font-semibold text-white">
            Quick paths
          </h2>
          <p className="text-xs text-gray-500">Go straight to the tools buyers use most.</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-600" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-[#ff950e]/40"
          >
            <div className="flex items-start gap-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${action.tone}`}>
                {action.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#ff950e] transition group-hover:text-[#ffb347]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
