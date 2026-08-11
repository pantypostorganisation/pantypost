// src/components/wallet/buyer/WalletHeader.tsx
'use client';

/* =====================================================================
 * Was: a 16x16 icon tile, a"BUYER HUB" pill in 0.4em letter-spacing, a
 * 5xl"Digital Wallet" headline, a sentence about staying"aligned with
 * the premium aesthetic", and a second card alongside advertising"Sync
 * with your dashboard".
 *
 * The balance and the deposit form are directly below this. A person who
 * has navigated to their wallet knows what a wallet is.
 *
 * The subtitle went the same way: it read "Add funds and review your
 * deposits", sitting directly above a section headed "Add funds" and a
 * row reading "Show recent transactions". Three lines, one meaning.
 * ===================================================================== */

export default function WalletHeader() {
  return <h1 className="text-2xl font-bold text-white sm:text-3xl">Wallet</h1>;
}
