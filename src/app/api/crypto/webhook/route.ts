// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
// base API for your Express backend
const APP_INTERNAL_API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'https://api.pantypost.com/api';
const ALLOW_UNVERIFIED_IPN =
  process.env.ALLOW_UNVERIFIED_IPN === 'true' ? true : false;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

function verifySignature(rawBody: string, headerSig: string | null): boolean {
  // if you haven't set the IPN secret, optionally allow it
  if (!NOWPAYMENTS_IPN_SECRET) return true;
  if (!headerSig) return false;

  const computed = crypto
    .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .digest('hex');

  return computed.toLowerCase() === headerSig.toLowerCase();
}

// pull username from order_id like pp-deposit-oakley-1730680800000
function extractUsername(payload: any): string {
  const orderId: string = payload?.order_id || '';

  if (orderId.startsWith('pp-deposit-')) {
    const parts = orderId.split('-');
    // ['pp', 'deposit', 'oakley', '1730680...']
    if (parts.length >= 3) {
      return parts[2];
    }
  }

  // fallback — not ideal, but better than empty
  const email: string | undefined = payload?.customer_email;
  if (email) {
    return email;
  }

  return 'buyer1';
}

export async function POST(req: NextRequest) {
  try {
    // NOWPayments sends raw body, and we need raw for signature
    const bodyText = await req.text();
    const headerSig = req.headers.get('x-nowpayments-sig');

    const isValid = verifySignature(bodyText, headerSig);
    if (!isValid && !ALLOW_UNVERIFIED_IPN) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = bodyText ? JSON.parse(bodyText) : {};

    // we only care about finished / confirmed payments
    const status: string | undefined = payload?.payment_status?.toLowerCase();
    if (status !== 'finished') {
      return NextResponse.json(
        { ignored: true, reason: `status=${status}` },
        { status: 200 }
      );
    }

    // NOWPayments usually gives you the USD amount in price_amount
    const amountUSD = Number(payload?.price_amount || 0);
    if (!amountUSD || Number.isNaN(amountUSD)) {
      return NextResponse.json(
        { error: 'Invalid amount from IPN' },
        { status: 400 }
      );
    }

    const username = extractUsername(payload);
    const orderId = payload?.order_id || 'unknown';
    const paymentId =
      payload?.payment_id ||
      payload?.paymentId ||
      payload?.invoice_id ||
      'nowp-unknown';

    // this is what we forward to Express
    const depositPayload = {
      username,
      amount: amountUSD,
      method: 'crypto',
      notes: `NOWPayments deposit (${orderId})`,
      txId: paymentId,
      orderId,
      source: 'nowpayments',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // add internal key so Express /deposit/system accepts it
    if (INTERNAL_API_KEY) {
      headers['x-api-key'] = INTERNAL_API_KEY.trim();
    }

    const depositRes = await fetch(
      `${APP_INTERNAL_API}/wallet/deposit/system`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(depositPayload),
      }
    );

    const depositData = await depositRes.json().catch(() => ({}));

    if (!depositRes.ok || !depositData?.success) {
      // you can return 200 to NOWPayments anyway, but log it
      console.error('[Webhook] Failed to credit wallet', depositData);
      return NextResponse.json(
        {
          error: 'Failed to credit wallet',
          details: depositData,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
