// src/components/wallet/buyer/CryptoDepositSection.tsx
'use client';

import { useState } from 'react';
import { CreditCard, ArrowRight, AlertCircle, CheckCircle, Coins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type CreatePaymentResponse = {
  success: boolean;
  data?: {
    payment_url?: string;
    id?: string;
  };
  error?: string;
};

export default function CryptoDepositSection() {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('25');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  const min = 5;
  const max = 5000;

  const handleAmountChange = (value: string) => {
    // basic 2-decimal guard
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) return;
    setAmount(value);
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const startCryptoDeposit = async () => {
    if (!user?.username) {
      setMessage({ type: 'error', text: 'You must be logged in as a buyer to deposit.' });
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < min || numericAmount > max) {
      setMessage({
        type: 'error',
        text: `Enter an amount between $${min} and $${max}.`,
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Build a good order_id for webhook mapping:
      // pp-deposit-<username>-<timestamp>
      const orderId = `pp-deposit-${user.username}-${Date.now()}`;

      const res = await fetch('/api/crypto/create-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount,
          // depending on how your /api/crypto/create-payment is shaped, you can add:
          // price_amount: numericAmount,
          // price_currency: 'usd',
          pay_currency: 'usdttrc20',
          order_id: orderId,
          description: `Wallet deposit for ${user.username}`,
          // you can pass username through metadata if your route forwards it
          metadata: {
            username: user.username,
            intent: 'wallet_deposit',
          },
        }),
      });

      const data: CreatePaymentResponse = await res.json();

      if (!data.success || !data.data?.payment_url) {
        setMessage({
          type: 'error',
          text: data.error || 'Could not start crypto checkout. Please try again.',
        });
        return;
      }

      // tiny success message before redirect (optional)
      setMessage({
        type: 'success',
        text: 'Redirecting to secure crypto checkout…',
      });

      // hard redirect to NOWPayments
      window.location.href = data.data.payment_url!;
    } catch (err: any) {
      console.error('[CryptoDeposit] error:', err);
      setMessage({
        type: 'error',
        text: 'Something went wrong starting the deposit. Try again in a moment.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
          <Coins className="h-5 w-5 text-[#ff950e]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Deposit with Crypto</h2>
          <p className="text-sm text-gray-400">
            Pay by card via NOWPayments, funds arrive in USDT (TRC-20), your PantyPost wallet is credited automatically.
          </p>
        </div>
      </div>

      {/* amount input */}
      <div className="space-y-3">
        <label htmlFor="crypto-amount" className="text-sm font-medium text-gray-200">
          Amount (USD)
        </label>
        <input
          id="crypto-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="w-full rounded-xl border border-gray-800 bg-[#0c0c0c] px-4 py-3 text-white outline-none ring-[#ff950e]/40 focus:border-[#ff950e] focus:ring-2"
          placeholder="25.00"
        />
        <p className="text-xs text-gray-500">
          Min ${min}, Max ${max}. You’ll be redirected to a secure NOWPayments checkout.
        </p>

        {/* quick buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[25, 50, 100, 200].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => handleAmountChange(String(a))}
              className="rounded-xl border border-gray-800 bg-[#0c0c0c] py-2 text-sm font-semibold text-gray-200 hover:border-[#ff950e] hover:text-white"
            >
              ${a}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={startCryptoDeposit}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff950e] px-10 py-3.5 text-sm font-semibold text-black transition hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            Connecting…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Continue to Crypto Checkout
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {message.text && (
        <div
          className={`flex items-start gap-2 rounded-2xl border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : message.type === 'error'
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-gray-800 bg-[#0c0c0c] text-gray-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mt-1" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 mt-1" />
          ) : null}
          <p>{message.text}</p>
        </div>
      )}
    </section>
  );
}
