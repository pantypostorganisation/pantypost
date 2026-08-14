// src/app/api/crypto/create-payment/route.ts
import { NextResponse } from 'next/server';

/* =====================================================================
 * CRYPTO DEPOSITS ARE CLOSED
 *
 * This route created a NOWPayments invoice -- the first step of a crypto
 * deposit. With the wallet UI removed and the webhook withdrawn, an
 * invoice created here could never be credited, so leaving it live would
 * mean a buyer could send real money into a payment that can never
 * complete.
 *
 * Closing this one matters more than the webhook: this is the end a
 * BUYER can reach.
 *
 * The original implementation is in git history.
 * ===================================================================== */

const GONE = {
  error: 'Crypto deposits are no longer accepted. Please use card.',
  code: 'CRYPTO_DEPOSITS_DISABLED',
};

export async function POST() {
  return NextResponse.json(GONE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
