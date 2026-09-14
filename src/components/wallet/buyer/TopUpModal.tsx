// src/components/wallet/buyer/TopUpModal.tsx
'use client';

/* Wallet top-up.
 *
 * Card is the default and crypto is the alternative, because that is
 * the order buyers actually want them in: a card is two taps and
 * something everyone already has, whereas crypto means an exchange
 * account and a transfer. Crypto stays because it is the private
 * option and because some buyers genuinely prefer it -- but making a
 * buyer choose a rail before seeing a price cost conversions, so the
 * amount comes first and the method second.
 *
 * Everything is USD. The previous version quoted AUD and then asked
 * for a USDT figure a third smaller, which read like a mistake.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Copy, Check, Loader2, ArrowLeft, CreditCard, Bitcoin } from 'lucide-react';

type Currency = { code: string; label: string; network: string; note: string };

type CardCheckout = {
  clientOrderId: string;
  checkoutId: string;
  onRampUrl: string;
  amountUsd: number;
};

type CryptoPayment = {
  paymentId: string;
  amountAud: number;
  payAmount: number;
  payCurrency: string;
  payAddress: string;
  payinExtraId: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  card: { enabled: boolean; min: number; max: number } | null;
  crypto: { enabled: boolean; currencies: Currency[]; min: number; max: number } | null;
  onCreateCard: (amount: number) => Promise<CardCheckout>;
  onCheckCard: (clientOrderId: string) => Promise<{ credited: boolean; creditedAmountUsd: number | null }>;
  onCreateCrypto: (amount: number, currency: string) => Promise<CryptoPayment>;
  onCheckCrypto: (paymentId: string) => Promise<{ credited: boolean; creditedAmountAud: number | null }>;
  onCredited: () => void;
  /** Set when returning from the hosted card page. */
  resumeOrderId?: string | null;
}

const QUICK_AMOUNTS = [25, 50, 100, 200];

/* Where to buy crypto, by region. Two per market -- six reads as
   homework, two reads as a recommendation. */
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

/* Timezone to region. No permission prompt, no IP lookup, and wrong
   only for people travelling -- who still get a working exchange. */
function detectRegion(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz === 'Pacific/Auckland') return 'NZ';
    if (tz.startsWith('America/')) {
      const canadian = ['Toronto', 'Vancouver', 'Edmonton', 'Winnipeg', 'Halifax', 'St_Johns'];
      return canadian.some((city) => tz.includes(city)) ? 'CA' : 'US';
    }
    if (tz === 'Europe/London') return 'GB';
    if (tz.startsWith('Europe/')) return 'EU';
    return 'DEFAULT';
  } catch {
    return 'DEFAULT';
  }
}

type View = 'amount' | 'method' | 'card-sent' | 'crypto-pay' | 'crypto-help' | 'done';

export default function TopUpModal({
  open, onClose, card, crypto,
  onCreateCard, onCheckCard, onCreateCrypto, onCheckCrypto, onCredited,
  resumeOrderId,
}: Props) {
  const [view, setView] = useState<View>('amount');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(crypto?.currencies[0]?.code || 'usdttrc20');
  const [cardOrder, setCardOrder] = useState<CardCheckout | null>(null);
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [credited, setCredited] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exchanges = useMemo(() => EXCHANGES[detectRegion()] ?? EXCHANGES.DEFAULT, []);
  const selectedCoin = crypto?.currencies.find((c) => c.code === currency);

  const min = card?.enabled ? card.min : (crypto?.min ?? 20);
  const max = card?.enabled ? card.max : (crypto?.max ?? 2000);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /* Returning from the hosted card page. The redirect carries the
     order id, so the wallet can confirm without the buyer wondering
     whether it worked. */
  useEffect(() => {
    if (!open || !resumeOrderId || credited !== null) return;
    setView('card-sent');
    setCardOrder({ clientOrderId: resumeOrderId, checkoutId: '', onRampUrl: '', amountUsd: 0 });
  }, [open, resumeOrderId, credited]);

  useEffect(() => {
    if (view !== 'card-sent' || !cardOrder || credited !== null) return;
    const tick = async () => {
      try {
        const result = await onCheckCard(cardOrder.clientOrderId);
        if (result.credited) {
          setCredited(result.creditedAmountUsd ?? cardOrder.amountUsd);
          setView('done');
          stopPolling();
          onCredited();
        }
      } catch {
        // Next tick retries.
      }
    };
    void tick();
    pollRef.current = setInterval(tick, 5000);
    return stopPolling;
  }, [view, cardOrder, credited, onCheckCard, onCredited, stopPolling]);

  useEffect(() => {
    if (view !== 'crypto-pay' || !cryptoPayment || credited !== null) return;
    const tick = async () => {
      try {
        const result = await onCheckCrypto(cryptoPayment.paymentId);
        if (result.credited) {
          setCredited(result.creditedAmountAud ?? cryptoPayment.amountAud);
          setView('done');
          stopPolling();
          onCredited();
        }
      } catch {
        // Next tick retries.
      }
    };
    pollRef.current = setInterval(tick, 5000);
    return stopPolling;
  }, [view, cryptoPayment, credited, onCheckCrypto, onCredited, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  if (!open) return null;

  const close = () => {
    stopPolling();
    setView('amount');
    setAmount('');
    setCardOrder(null);
    setCryptoPayment(null);
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

  const validAmount = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < min || value > max) {
      setError(`Enter an amount between $${min} and $${max}.`);
      return null;
    }
    return value;
  };

  const payByCard = async () => {
    const value = validAmount();
    if (value === null) return;
    setLoading(true);
    setError(null);
    try {
      const checkout = await onCreateCard(value);
      setCardOrder(checkout);
      setView('card-sent');
      // Their hosted page, in a new tab so the wallet stays open behind it.
      window.open(checkout.onRampUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the payment.');
    } finally {
      setLoading(false);
    }
  };

  const payByCrypto = async () => {
    const value = validAmount();
    if (value === null) return;
    setLoading(true);
    setError(null);
    try {
      setCryptoPayment(await onCreateCrypto(value, currency));
      setView('crypto-pay');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the payment.');
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

        {/* ---------- Done ---------- */}
        {view === 'done' && (
          <div className="py-4">
            <p className="text-2xl font-semibold text-white">
              ${credited?.toFixed(2)} added
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
        )}

        {/* ---------- Amount ---------- */}
        {view === 'amount' && (
          <div>
            <h2 className="text-lg font-semibold text-white">Add funds</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Your balance can be spent with any seller.
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
                aria-label="Amount in US dollars"
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

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <button
              type="button"
              onClick={() => {
                if (validAmount() === null) return;
                // One rail available means no choice worth presenting.
                if (card?.enabled && crypto?.enabled) setView('method');
                else if (card?.enabled) void payByCard();
                else void payByCrypto();
              }}
              className="mt-5 w-full rounded-md bg-primary py-3.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Continue
            </button>
          </div>
        )}

        {/* ---------- Method ---------- */}
        {view === 'method' && (
          <div>
            <button
              type="button"
              onClick={() => setView('amount')}
              className="-ml-1 flex items-center gap-1 rounded-sm p-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <h2 className="mt-4 text-lg font-semibold text-white">
              How would you like to pay ${Number(amount).toFixed(2)}?
            </h2>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={payByCard}
                disabled={loading}
                className="flex w-full items-start gap-3 rounded-md border border-primary bg-primary-soft p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
              >
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-white">Card</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                    Visa or Mastercard. Takes about a minute.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setView('crypto-pay')}
                className="flex w-full items-start gap-3 rounded-md border border-line p-4 text-left transition-colors hover:border-line-strong"
              >
                <Bitcoin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-white">Crypto</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                    Nothing appears on a card statement.
                  </span>
                </span>
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            {loading && (
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> One moment
              </p>
            )}
          </div>
        )}

        {/* ---------- Card: paying in another tab ---------- */}
        {view === 'card-sent' && (
          <div>
            <h2 className="text-lg font-semibold text-white">Complete your payment</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              We&apos;ve opened a secure payment page in a new tab. Finish there and your
              balance updates here automatically.
            </p>

            {cardOrder?.onRampUrl && (
              <button
                type="button"
                onClick={() => window.open(cardOrder.onRampUrl, '_blank', 'noopener,noreferrer')}
                className="mt-5 w-full rounded-md border border-line py-3 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Reopen payment page
              </button>
            )}

            <div className="mt-5 flex items-center gap-2.5 rounded-md border border-line bg-black/40 px-3.5 py-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-ink-muted">Waiting for your payment</p>
            </div>

            <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
              Card details are handled by our payment provider and never reach us.
            </p>
          </div>
        )}

        {/* ---------- Crypto: choose coin, then pay ---------- */}
        {view === 'crypto-pay' && !cryptoPayment && (
          <div>
            <button
              type="button"
              onClick={() => setView(card?.enabled ? 'method' : 'amount')}
              className="-ml-1 flex items-center gap-1 rounded-sm p-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <h2 className="mt-4 text-lg font-semibold text-white">Pay with</h2>

            <div className="mt-4 space-y-1.5">
              {(crypto?.currencies ?? []).map((option) => (
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
              onClick={payByCrypto}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> One moment</> : 'Continue'}
            </button>

            <button
              type="button"
              onClick={() => setView('crypto-help')}
              className="mt-3 w-full rounded-sm py-1 text-center text-xs text-ink-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              Need crypto first?
            </button>
          </div>
        )}

        {view === 'crypto-pay' && cryptoPayment && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Send exactly</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {cryptoPayment.payAmount}{' '}
              <span className="text-lg text-ink-muted">{cryptoPayment.payCurrency.toUpperCase()}</span>
            </p>

            {selectedCoin && (
              /* The one mistake that loses the money outright, so it
                 sits above the address rather than below it. */
              <p className="mt-4 rounded-md border border-warning/40 bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-warning">
                Send only {selectedCoin.label} on the {selectedCoin.network} network.
                Anything else cannot be recovered.
              </p>
            )}

            <div className="mt-4 space-y-2">
              <Field
                label="Address"
                value={cryptoPayment.payAddress}
                mono
                onCopy={() => copy(cryptoPayment.payAddress, 'address')}
                copied={copied === 'address'}
              />
              <Field
                label="Amount"
                value={`${cryptoPayment.payAmount} ${cryptoPayment.payCurrency.toUpperCase()}`}
                mono
                onCopy={() => copy(String(cryptoPayment.payAmount), 'amount')}
                copied={copied === 'amount'}
              />
              {cryptoPayment.payinExtraId && (
                <div className="rounded-md border border-warning/40 bg-warning-soft p-3">
                  <p className="text-xs font-medium text-warning">Memo required</p>
                  <p className="mt-1 break-all font-mono text-xs text-white">{cryptoPayment.payinExtraId}</p>
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

        {/* ---------- Where to buy crypto ---------- */}
        {view === 'crypto-help' && (
          <div>
            <button
              type="button"
              onClick={() => setView('crypto-pay')}
              className="-ml-1 flex items-center gap-1 rounded-sm p-1 text-xs text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <h2 className="mt-4 text-lg font-semibold text-white">Getting crypto</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Around fifteen minutes the first time, then under a minute after that.
              Paying by card is quicker if you&apos;d rather.
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
                  USDT holds its value against the dollar, so what you buy is what you
                  spend. Choose the Tron network when you withdraw &mdash; the fee is
                  about a cent.
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
              onClick={() => setView('crypto-pay')}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Continue
            </button>
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
