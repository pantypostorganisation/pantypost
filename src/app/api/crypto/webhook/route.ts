// src/app/api/crypto/webhook/route.ts
import { NextResponse } from 'next/server';

/* =====================================================================
 * CRYPTO DEPOSITS ARE CLOSED
 *
 * This route used to accept NOWPayments IPN callbacks and, on a
 * confirmed payment, call POST /wallet/deposit/system on the backend --
 * i.e. it could credit a user's wallet.
 *
 * The signature verification here was sound (HMAC-SHA512, failing closed
 * when the secret is unset), so this is not a fix for a hole. It is
 * removal of an attack surface that no longer earns its place: card via
 * SegPay is the funding route, the crypto UI is gone from the wallet,
 * and a wallet-crediting endpoint should not stay reachable for a
 * payment method nobody can start.
 *
 * 410 Gone rather than 404: it tells NOWPayments (or anyone else still
 * calling) that this endpoint existed and has been withdrawn, rather
 * than implying a routing mistake they should retry through.
 *
 * The original implementation is in git history. To restore crypto:
 * revert this file, re-mount /api/crypto in server.js, and reinstate the
 * wallet UI components (which are still on disk, just unimported).
 * ===================================================================== */

const GONE = {
  error: 'Crypto deposits are no longer accepted',
  code: 'CRYPTO_DEPOSITS_DISABLED',
};

export async function POST() {
  console.warn('[Webhook] Crypto webhook called but deposits are disabled');
  return NextResponse.json(GONE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}
