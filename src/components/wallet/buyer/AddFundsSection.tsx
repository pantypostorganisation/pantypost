// src/components/wallet/buyer/AddFundsSection.tsx
'use client';

/* The add-funds panel on the buyer wallet.
 *
 * The card visual is kept -- it reads as a wallet at a glance and it is
 * the nicest thing on the page. What is gone is everything that was
 * pretending: the mock card number, the cardholder input, the iframe
 * placeholder, the $5 minimum and Segpay's logo, none of which had a
 * processor behind them after Segpay declined the account.
 *
 * So the card now shows real things only -- the actual balance, the
 * actual username, our own mark -- and the amount is chosen inside the
 * crypto modal rather than in a form that went nowhere.
 */

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface AddFundsSectionProps {
  balance: number;
  /** Opens the crypto top-up modal. */
  onAddFunds: () => void;
  /** Read from the backend so the copy cannot drift from the config. */
  minDeposit?: number;
  maxDeposit?: number;
  /** Shown on the card. */
  username?: string;
  /** Changes the copy: card first when it is available, crypto when not. */
  cardEnabled?: boolean;
}

export default function AddFundsSection({
  balance,
  onAddFunds,
  minDeposit = 20,
  maxDeposit = 2000,
  username,
  cardEnabled = false,
}: AddFundsSectionProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <section className="rounded-lg border border-line bg-surface-raised p-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        {/* The card. Real balance, real name, no invented digits. */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[400px]">
            <div
              className="relative overflow-hidden rounded-lg border border-line bg-gradient-to-br from-surface-overlay to-surface transition-transform duration-300 hover:scale-[1.02]"
              style={{ aspectRatio: '1.586' }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <Image
                    src="/logo.png"
                    alt="PantyPost"
                    width={70}
                    height={70}
                    quality={90}
                    className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                  />
                  <span className="rounded-sm border border-line px-2 py-1 text-[10px] uppercase tracking-wider text-ink-faint">
                    Wallet
                  </span>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                    Available balance
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-white sm:text-4xl">
                    ${balance.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-ink-faint">
                      Account
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-white">
                      {username || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What the money is for and how to add it. */}
        <div>
          <h2 className="text-base font-semibold text-white">Add funds</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
            {cardEnabled
              ? 'Top up by card or crypto, then buy from any seller without entering payment details again.'
              : 'Top up your wallet with crypto, then buy from any seller without entering payment details again.'}
          </p>

          <button
            type="button"
            onClick={onAddFunds}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover sm:w-auto"
          >
            Add funds
            <ArrowRight
              className={`h-4 w-4 transition-transform ${hovered ? 'translate-x-0.5' : ''}`}
              aria-hidden="true"
            />
          </button>

          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <div className="flex gap-2.5">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-white">Instant</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  Funds appear within a minute, any time of day.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-white">Discreet</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {cardEnabled
                    ? 'Card statements show our billing name, never what you bought.'
                    : 'Nothing about your purchase appears on a card statement.'}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-ink-faint">
            Minimum ${minDeposit}, maximum ${maxDeposit.toLocaleString()} per top-up.
            {!cardEnabled && ' No crypto yet? We\u2019ll show you how.'}
          </p>
        </div>
      </div>
    </section>
  );
}
