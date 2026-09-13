// src/components/wallet/buyer/CryptoTopUpModal.tsx
'use client';

/* Crypto wallet top-up.
 *
 * Two decisions here are about conversion rather than appearance.
 *
 * First, there is no "do you already have crypto?" question. Asking it
 * puts a decision in front of a buyer who has not yet seen a price,
 * and every extra screen before the payment details costs deposits.
 * The buyer who already holds crypto -- the one who will actually
 * convert -- reaches an address in two taps. The buyer who does not
 * finds a quiet "Need crypto first?" line underneath, where it is
 * useful rather than in the way.
 *
 * Second, the exchange suggestions are chosen by the buyer's country.
 * Telling an American to sign up for CoinSpot is worse than saying
 * nothing: it reads as not knowing who you are talking to, and the
 * link goes nowhere useful. Country comes from the browser timezone,
 * which needs no permission prompt and no geo headers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, Loader2, ArrowLeft } from 'lucide-react';

type Currency = { code: string; label: string; network: string; note: string };

type Payment = {
  paymentId: string;
  amountAud: number;
  payAmount: number;
  payCurrency: string;
  payAddress: string;
  payinExtraId: string | null;
  expiresAt: string;
  status: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  currencies: Currency[];
  min: number;
  max: number;
  onCreate: (amount: number, currency: string) => Promise<Payment>;
  onCheckStatus: (paymentId: string) => Promise<{ credited: boolean; status: string; creditedAmountAud: number | null }>;
  onCredited: () => void;
}

const QUICK_AMOUNTS = [25, 50, 100, 200];

/* Where to buy crypto, by region. Kept to two per market: a list of
   six reads as a research task, two reads as a recommendation. */
const EXCHANGES: Record<string, { name: string; url: string }[]> = {
  AU: [
    { name: 'CoinSpot', url: 'https://www.coinspot.com.au' },
    { name: 'Independent Reserve', url: 'https://www.independentreserve.com' },
  ],
  US: [
    { name: 'Coinbase', url: 'https://www.coinbase.com' },
    { name: 'Kraken', url: 'https://www.kraken.com' },
  ],
  GB: [
    { name: 'Coinbase', url: 'https://www.coinbase.com' },
    { name: 'Kraken', url: 'https://www.kraken.com' },
  ],
  CA: [
    { name: 'Shakepay', url: 'https://shakepay.com' },
    { name: 'Kraken', url: 'https://www.kraken.com' },
  ],
  NZ: [
    { name: 'Easy Crypto', url: 'https://easycrypto.com/nz' },
    { name: 'Kraken', url: 'https://www.kraken.com' },
  ],
  EU: [
    { name: 'Bitvavo', url: 'https://bitvavo.com' },
    { name: 'Kraken', url: 'https://www.kraken.com' },
  ],
  DEFAULT: [
    { name: 'Kraken', url: 'https://www.kraken.com' },
    { name: 'Coinbase', url: 'https://www.coinbase.com' },
  ],
};

/* Timezone to country. No permission prompt, no IP lookup, no CDN geo
   headers -- and wrong only for people travelling, who still get a
   working exchange, just not their local one. */
function detectRegion(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('Pacific/Auckland')) return 'NZ';
    if (tz.startsWith('America/')) {
      if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Edmonton') ||
          tz.includes('Winnipeg') || tz.includes('Halifax') || tz.includes('St_Johns')) return 'CA';
      return 'US';
    }
    if (tz === 'Europe/London') return 'GB';
    if (tz.startsWith('Europe/')) return 'EU';
    return 'DEFAULT';
  } catch {
    return 'DEFAULT';
  }
}

export default function CryptoTopUpModal({
  open, onClose, currencies, min, max, onCreate, onCheckStatus, onCredited,
}: Props) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(currencies[0]?.code || 'usdttrc20');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [credited, setCredited] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exchanges = useMemo(() => EXCHANGES[detectRegion()] ?? EXCHANGES.DEFAULT, []);
  const selected = currencies.find((c) => c.code === currency);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /* The webhook is what credits the wallet. This only tells the buyer
     it landed, so a dropped poll costs nothing. */
  useEffect(() => {
    if (!payment || credited !== null) return;
    const tick = async () => {
      try {
        const result = await onCheckStatus(payment.paymentId);
        if (result.credited) {
          setCredited(result.creditedAmountAud ?? payment.amountAud);
          stopPolling();
          onCredited();
        }
      } catch {
        // Next tick retries.
      }
    };
    pollRef.current = setInterval(tick, 5000);
    return stopPolling;
  }, [payment, credited, onCheckStatus, onCredited, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  if (!open) return null;

  const close = () => {
    stopPolling();
    setAmount('');
    setPayment(null);
    setShowHelp(false);
    setError(null);
    setCopied(null);
    setCredited(null);
    onClose();
  };

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard may be blocked; the value is selectable on screen.
    }
  };

  const create = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < min || value > max) {
      setError(`Enter an amount between $${min} and $${max}.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPayment(await onCreate(value, currency));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add funds"
      onClick={close}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[26rem] overflow-y-auto rounded-t-lg border border-line bg-surface-raised p-6 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-sm p-1 text-ink-faint transition-colors hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ---------- Confirmed ---------- */}
        {credited !== null ? (
          <div className="py-4">
            <p className="text-2xl font-semibold text-white">
              ${credited.toFixed(2)} added
            </p>
            <p className="mt-1.5 text-sm text-ink-muted">
              It&apos;s in your wallet and ready to spend.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Browse listings
            </button>
          </div>
        ) : showHelp ? (
          /* ---------- Where to buy crypto ---------- */
          <div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="-ml-1 flex items-center gap-1 rounded-sm p-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <h2 className="mt-4 text-lg font-semibold text-white">Getting crypto</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Around fifteen minutes the first time, then under a minute after that.
            </p>

            <ol className="mt-5 space-y-4 text-sm">
              <li>
                <p className="font-medium text-white">Open an account</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  These two are well established and let you withdraw straight away.
                </p>
                <div className="mt-2.5 flex gap-2">
                  {exchanges.map((exchange) => (
                    <a
                      key={exchange.name}
                      href={exchange.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                    >
                      {exchange.name}
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <p className="font-medium text-white">Verify your ID</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  Required by law everywhere. A few minutes with a licence or passport.
                </p>
              </li>
              <li>
                <p className="font-medium text-white">Buy USDT</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  Pay by card or bank transfer. USDT holds its value against the dollar,
                  so what you buy is what you spend. Choose the Tron network when you
                  withdraw &mdash; the fee is about a cent.
                </p>
              </li>
              <li>
                <p className="font-medium text-white">Come back here</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  We&apos;ll give you an address. Your balance updates by itself.
                </p>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Continue
            </button>
          </div>
        ) : !payment ? (
          /* ---------- Amount and coin ---------- */
          <div>
            <h2 className="text-lg font-semibold text-white">Add funds</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Pay with crypto. No card, no waiting.
            </p>

            <div className="relative mt-5">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-ink-faint">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="50"
                aria-label="Amount in Australian dollars"
                className="w-full rounded-md border border-line bg-black py-4 pl-9 pr-4 text-xl font-semibold text-white placeholder-ink-faint focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAmount(String(value)); setError(null); }}
                  className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                    amount === String(value)
                      ? 'border-primary bg-primary text-black'
                      : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  ${value}
                </button>
              ))}
            </div>

            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-ink-faint">
              Pay with
            </p>
            <div className="mt-2 space-y-1.5">
              {currencies.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setCurrency(option.code)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md border px-3.5 py-3 text-left transition-colors ${
                    currency === option.code
                      ? 'border-primary bg-primary-soft'
                      : 'border-line hover:border-line-strong'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {option.label}
                      <span className="ml-1.5 font-normal text-ink-muted">{option.network}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-faint">{option.note}</span>
                  </span>
                  {currency === option.code && (
                    <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> One moment</> : 'Continue'}
            </button>

            {/* Deliberately quiet. The buyer who needs it will look for
                it; the buyer who does not should not be slowed by it. */}
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="mt-3 w-full rounded-sm py-1 text-center text-xs text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              Need crypto first?
            </button>
          </div>
        ) : (
          /* ---------- Send payment ---------- */
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Send exactly</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {payment.payAmount} <span className="text-lg text-ink-muted">{payment.payCurrency.toUpperCase()}</span>
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              for ${payment.amountAud.toFixed(2)} of credit
            </p>

            {selected && (
              /* Sending on the wrong chain is the one mistake that
                 loses the money outright, so it sits above the address
                 rather than in small print below it. */
              <p className="mt-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-warning">
                Send only {selected.label} on the {selected.network} network.
                Anything else cannot be recovered.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <Field
                label="Address"
                value={payment.payAddress}
                mono
                onCopy={() => copy(payment.payAddress, 'address')}
                copied={copied === 'address'}
              />
              <Field
                label="Amount"
                value={`${payment.payAmount} ${payment.payCurrency.toUpperCase()}`}
                mono
                onCopy={() => copy(String(payment.payAmount), 'amount')}
                copied={copied === 'amount'}
              />
              {payment.payinExtraId && (
                <div className="rounded-md border border-warning/40 bg-warning-soft p-3">
                  <p className="text-xs font-medium text-warning">Memo required</p>
                  <p className="mt-1 break-all font-mono text-xs text-white">{payment.payinExtraId}</p>
                  <p className="mt-1 text-xs text-warning/80">
                    Without this the payment cannot be matched to you.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2.5 rounded-md border border-line bg-black/40 px-3.5 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-ink-muted">Waiting for your payment</p>
            </div>

            <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
              Your balance updates by itself, usually within a minute.
              You can close this window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, mono, onCopy, copied,
}: { label: string; value: string; mono?: boolean; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-line bg-black/40 p-3.5">
      <div className="min-w-0">
        <p className="text-xs text-ink-faint">{label}</p>
        <p className={`mt-1 break-all text-sm text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="shrink-0 rounded-md border border-line p-2 text-ink-muted transition-colors hover:border-primary hover:text-primary"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
}
