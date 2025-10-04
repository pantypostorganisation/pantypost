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
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Quick paths</h2>
          <p className="text-xs text-slate-400">Go straight to the tools buyers use most.</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-500" />
      </div>

      <div className="mt-6 space-y-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-orange-300/40 hover:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${action.tone}`}>
                {action.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-100">{action.title}</p>
                <p className="text-xs text-slate-400">{action.description}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-200">Open</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
