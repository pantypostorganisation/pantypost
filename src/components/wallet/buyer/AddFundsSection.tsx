// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

/* The add-funds panel on the buyer wallet.
 *
 * This used to render a mock credit card, a cardholder field and a
 * placeholder for Segpay's iframe, against a $5 minimum. Segpay
 * declined the account on category grounds, so none of it could ever
 * take a payment -- it was a form that looked real, quoted a minimum
 * that no longer applies, and carried the logo of a processor we do
 * not have.
 *
 * Now it states the balance, explains the one rail that works, and
 * hands off to the crypto modal. When card acquiring is approved this
 * is where the card form goes back, not before.
 */

import { useState } from 'react';
import { Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface AddFundsSectionProps {
  balance: number;
  /** Opens the crypto top-up modal. */
  onAddFunds: () => void;
  /** Read from the backend so the copy cannot drift from the config. */
  minDeposit?: number;
  maxDeposit?: number;
}

export default function AddFundsSection({
  balance,
  onAddFunds,
  minDeposit = 20,
  maxDeposit = 2000,
}: AddFundsSectionProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="rounded-lg border border-line bg-surface-raised p-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Add funds</h2>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-faint">Your balance</p>
          <p className="mt-1 text-3xl font-semibold text-white">
            ${balance.toFixed(2)}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddFunds}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
        >
          Add funds
          <ArrowRight
            className={`h-4 w-4 transition-transform ${hovered ? 'translate-x-0.5' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
        <div className="flex gap-2.5">
          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-white">Instant</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              Funds appear in your wallet within a minute, any time of day.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-white">Private</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              Pay with crypto. Nothing about your purchase appears on a card statement.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Minimum ${minDeposit}, maximum ${maxDeposit.toLocaleString()} per top-up.
        Don&apos;t have crypto? We&apos;ll show you how.
      </p>
    </section>
  );
}
