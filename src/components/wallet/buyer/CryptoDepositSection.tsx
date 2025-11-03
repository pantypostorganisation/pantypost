// app/(whatever-your-segment-is)/wallet/components/CryptoDepositSection.tsx
"use client";

import React, { useState } from "react";
import {
  Wallet,
  Bitcoin,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type CryptoDepositSectionProps = {
  username?: string;
  minAmount?: number;
};

export default function CryptoDepositSection({
  username,
  minAmount = 10,
}: CryptoDepositSectionProps) {
  const [amount, setAmount] = useState<string>(minAmount.toString());
  const [loading, setLoading] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCryptoDeposit = async () => {
    setError(null);
    setSuccessUrl(null);

    const numericAmount = Number(amount);
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid deposit amount.");
      return;
    }

    setLoading(true);
    try {
      // call YOUR Next.js route (the one that talks to NOWPayments)
      const res = await fetch("/api/crypto/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          // keep your nice order_id so webhook can parse username
          order_id: username ? `wallet-${username}-${Date.now()}` : undefined,
          description: "PantyPost wallet deposit",
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!data?.success) {
        setError(
          data?.error ||
            "Unable to start crypto payment. Please try again in a moment."
        );
        return;
      }

      const url: string | undefined = data?.data?.payment_url;
      if (!url) {
        setError("Payment was created but no checkout URL was returned.");
        return;
      }

      setSuccessUrl(url);

      // best UX = open the real NOWPayments page in a new tab
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      console.error("[CryptoDepositSection] start deposit failed:", err);
      setError(
        err?.message || "Unexpected error starting crypto payment. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
      {/* header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
          <Bitcoin size={20} />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Crypto deposit
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Pay with BTC / ETH / USDT via NOWPayments.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-5">
        {/* amount input */}
        <label className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm text-slate-200">
            Amount (USD)
          </span>
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 focus-within:border-orange-400/70 focus-within:ring-2 focus-within:ring-orange-500/10">
            <span className="mr-2 mt-1 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min={minAmount}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white text-sm sm:text-base"
              placeholder={minAmount.toString()}
            />
            <button
              type="button"
              onClick={() => setAmount(minAmount.toString())}
              className="ml-2 rounded-md bg-slate-800/70 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              Min
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Minimum deposit is ${minAmount}. We&apos;ll open a secure payment
            page in a new tab.
          </p>
        </label>

        {/* error state */}
        {error ? (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/5 border border-red-500/40 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-red-300 mt-0.5" />
            <p className="text-xs text-red-100">{error}</p>
          </div>
        ) : null}

        {/* success state */}
        {successUrl ? (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/40 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5" />
            <div className="text-xs text-emerald-50">
              <p>Payment created.</p>
              <p className="mt-1">
                If it didn&apos;t open automatically,{" "}
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  click here to open the payment
                </a>
                .
              </p>
            </div>
          </div>
        ) : null}

        {/* action button */}
        <button
          onClick={startCryptoDeposit}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-medium text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating payment...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Deposit with crypto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
