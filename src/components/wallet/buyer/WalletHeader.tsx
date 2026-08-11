// src/components/wallet/buyer/WalletHeader.tsx
'use client';

/* =====================================================================
 * Was: a 16x16 icon tile, a "BUYER HUB" pill in 0.4em letter-spacing, a
 * 5xl "Digital Wallet" headline, a sentence about staying "aligned with
 * the premium aesthetic", and a second card alongside advertising "Sync
 * with your dashboard".
 *
 * The balance and the deposit form are directly below this. A person who
 * has navigated to their wallet knows what a wallet is.
 * ===================================================================== */

export default function WalletHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Wallet</h1>
      <p className="mt-1 text-sm text-ink-muted">Add funds and review your deposits.</p>
    </div>
  );
}
