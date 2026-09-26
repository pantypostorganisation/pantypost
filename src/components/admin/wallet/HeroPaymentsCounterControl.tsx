// src/components/admin/wallet/HeroPaymentsCounterControl.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  paymentStatsService,
  type HeroCounterAdminState,
} from '@/services/paymentStats.service';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function HeroPaymentsCounterControl() {
  const [settings, setSettings] = useState<HeroCounterAdminState | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const response = await paymentStatsService.getHeroCounterSettings();

    if (response.success && response.data) {
      setSettings(response.data);
      setAmount(
        response.data.heroDisplayAdjustmentEnabled
          ? String(response.data.heroDisplayAdjustment)
          : ''
      );
    } else {
      setMessage({
        type: 'error',
        text:
          response.error?.message ||
          'Unable to load hero counter settings.',
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);
  const canApply =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && !isSaving;

  const handleApply = async () => {
    if (!canApply) {
      setMessage({
        type: 'error',
        text: 'Enter an adjustment greater than $0.',
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const response = await paymentStatsService.setHeroCounterAdjustment(
      Math.round(parsedAmount * 100) / 100
    );

    if (response.success && response.data) {
      setSettings(response.data);
      setAmount(String(response.data.heroDisplayAdjustment));
      setMessage({
        type: 'success',
        text: 'Hero display adjustment updated.',
      });
    } else {
      setMessage({
        type: 'error',
        text:
          response.error?.message ||
          'Unable to update the hero display adjustment.',
      });
    }

    setIsSaving(false);
  };

  const handleRemove = async () => {
    if (!settings?.heroDisplayAdjustmentEnabled) {
      return;
    }

    const confirmed = window.confirm(
      'Remove the hero display adjustment? The homepage will immediately return to the genuine payments processed total.'
    );

    if (!confirmed) {
      return;
    }

    setIsRemoving(true);
    setMessage(null);

    const response = await paymentStatsService.removeHeroCounterAdjustment();

    if (response.success && response.data) {
      setSettings(response.data);
      setAmount('');
      setMessage({
        type: 'success',
        text: 'Adjustment removed. The hero is showing the genuine processed total again.',
      });
    } else {
      setMessage({
        type: 'error',
        text:
          response.error?.message ||
          'Unable to remove the hero display adjustment.',
      });
    }

    setIsRemoving(false);
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#111111]/85 via-[#0b0b0b]/70 to-[#050505]/70 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <BadgeDollarSign className="h-5 w-5 text-[#ff950e]" />
            Hero Payments Counter
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Add a temporary display-only amount to the homepage hero counter.
            The genuine payments-processed total is never modified. The public
            label remains
            {' '}
            <span className="font-medium text-gray-200">
              Payments processed
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={isLoading || isSaving || isRemoving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 flex min-h-40 items-center justify-center rounded-xl border border-white/5 bg-black/30">
          <div className="text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#ff950e]" />
            <p className="mt-3 text-sm text-gray-400">
              Loading counter settings...
            </p>
          </div>
        </div>
      ) : settings ? (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Actual payments processed
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatCurrency(
                  settings.actualPaymentsProcessed ??
                    settings.totalPaymentsProcessed
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Genuine transaction-derived value
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Hero adjustment
              </p>
              <p
                className={`mt-2 text-2xl font-semibold ${
                  settings.heroDisplayAdjustmentEnabled
                    ? 'text-[#ff950e]'
                    : 'text-gray-500'
                }`}
              >
                {settings.heroDisplayAdjustmentEnabled ? '+' : ''}
                {formatCurrency(settings.heroDisplayAdjustment)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {settings.heroDisplayAdjustmentEnabled
                  ? 'Display-only adjustment active'
                  : 'No adjustment active'}
              </p>
            </div>

            <div className="rounded-xl border border-[#ff950e]/20 bg-[#ff950e]/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#ffb04d]">
                Homepage display
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#ff950e]">
                {formatCurrency(
                  settings.displayedCounterTotal ??
                    settings.totalPaymentsProcessed
                )}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Public label: {settings.counterLabel || 'Payments processed'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="hero-counter-adjustment"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Temporary hero adjustment (USD)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  $
                </span>
                <input
                  id="hero-counter-adjustment"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="5000.00"
                  disabled={isSaving || isRemoving}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-8 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#ff950e]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={!canApply || isRemoving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff950e] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ffa733] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {settings.heroDisplayAdjustmentEnabled
                  ? 'Update adjustment'
                  : 'Apply adjustment'}
              </button>

              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={
                  !settings.heroDisplayAdjustmentEnabled ||
                  isSaving ||
                  isRemoving
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-gray-600"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Remove adjustment
              </button>
            </div>
          </div>

          {settings.heroDisplayAdjustmentUpdatedAt && (
            <p className="mt-4 text-xs text-gray-500">
              Last counter adjustment change:{' '}
              {new Date(
                settings.heroDisplayAdjustmentUpdatedAt
              ).toLocaleString()}
            </p>
          )}
        </>
      ) : null}

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'error'
              ? 'border-red-500/25 bg-red-500/10 text-red-200'
              : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
