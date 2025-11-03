// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const APP_INTERNAL_API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'https://api.pantypost.com/api';
const ALLOW_UNVERIFIED_IPN =
  process.env.ALLOW_UNVERIFIED_IPN === 'true' ? true : false;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// simple in-memory idempotency store (payment_id -> timestamp)
const processedPayments = new Map<string, number>();
// how long we consider a payment_id "handled" (ms)
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours

function verifySignature(rawBody: string, headerSig: string | null): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) return true;
  if (!headerSig) return false;

  const computed = crypto
    .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .digest('hex');

  return computed.toLowerCase() === headerSig.toLowerCase();
}

// pull username from order_id like pp-deposit-oakley-1730680...
function extractUsername(payload: any): string {
  const orderId: string = payload?.order_id || '';

  if (orderId.startsWith('pp-deposit-')) {
    const parts = orderId.split('-');
    if (parts.length >= 3) {
      return parts[2];
    }
  }

  const email: string | undefined = payload?.customer_email;
  if (email) {
    return email;
  }

  return 'buyer1';
}

function isIdempotentHit(paymentId: string | undefined): boolean {
  if (!paymentId) return false;

  const now = Date.now();
  const existing = processedPayments.get(paymentId);

  // clean old entries
  if (existing && now - existing < IDEMPOTENCY_TTL_MS) {
    return true;
  }

  // mark as seen
  processedPayments.set(paymentId, now);

  // opportunistic cleanup to avoid unbounded growth
  if (processedPayments.size > 500) {
    const cutoff = now - IDEMPOTENCY_TTL_MS;
    for (const [id, ts] of processedPayments.entries()) {
      if (ts < cutoff) {
        processedPayments.delete(id);
      }
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
<<<<<<< HEAD
    const body = await req.json().catch(() => ({}));

    const amount = Number(body?.amount);
    const frontendOrderId =
      typeof body?.order_id === 'string' ? body.order_id : '';
    const payCurrency =
      typeof body?.pay_currency === 'string' ? body.pay_currency : undefined;
    const description =
      typeof body?.description === 'string'
        ? body.description
        : 'PantyPost wallet deposit';
=======
    const bodyText = await req.text();
    const headerSig = req.headers.get('x-nowpayments-sig');
>>>>>>> parent of 02b9e014 (Oggikinssss)

    const isValid = verifySignature(bodyText, headerSig);
    if (!isValid && !ALLOW_UNVERIFIED_IPN) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = bodyText ? JSON.parse(bodyText) : {};
    const status: string | undefined = payload?.payment_status?.toLowerCase();

    // NOWPayments can send a few statuses — we only care about money actually arrived
    if (status !== 'finished') {
      return NextResponse.json(
<<<<<<< HEAD
        { success: false, error: 'Invalid amount. Send { "amount": 25 }' },
        { status: 200 }
=======
        { ignored: true, reason: `status=${status}` },
        { status: 200 }
      );
    }

    const amountUSD = Number(payload?.price_amount || 0);
    if (!amountUSD || Number.isNaN(amountUSD)) {
      return NextResponse.json(
        { error: 'Invalid amount from IPN' },
        { status: 400 }
>>>>>>> parent of 02b9e014 (Oggikinssss)
      );
    }

    const username = extractUsername(payload);
    const orderId = payload?.order_id || 'unknown';
    const paymentId: string =
      payload?.payment_id ||
      payload?.paymentId ||
      payload?.invoice_id ||
      '';

    // 🛡️ idempotency: if we saw this paymentId recently, don't credit again
    if (isIdempotentHit(paymentId)) {
      // return 200 so NOWPayments stops retrying
      return NextResponse.json(
        {
<<<<<<< HEAD
          success: false,
          error: 'NOWPAYMENTS_API_KEY is not set on the server',
=======
          success: true,
          idempotent: true,
          message: 'Payment already processed',
>>>>>>> parent of 02b9e014 (Oggikinssss)
        },
        { status: 200 }
      );
    }

<<<<<<< HEAD
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
      'https://pantypost.com';

    // keep the nice order_id so webhook can parse username
    const orderId =
      frontendOrderId && frontendOrderId.length > 0
        ? frontendOrderId
        : `pp-deposit-${Date.now()}`;

    // build payload exactly like NOWPayments wants
    const payload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer?deposit=success`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
    };

    // only send pay_currency if we have it
    if (payCurrency) {
      payload['pay_currency'] = payCurrency;
    }

    // 👇 DO NOT forward body.metadata — NOWPayments rejected it
    // we can still use it in our webhook because we have order_id = pp-deposit-<username>-<ts>

    const res = await fetch(NOWPAYMENTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[NOWPayments] create payment failed:', data);
      return NextResponse.json(
        {
          success: false,
          error: data?.message || 'NOWPayments create payment failed',
          details: data,
        },
        { status: 200 }
      );
=======
    const depositPayload = {
      username,
      amount: amountUSD,
      method: 'crypto',
      notes: `NOWPayments deposit (${orderId})`,
      txId: paymentId || orderId,
      orderId,
      source: 'nowpayments',
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (INTERNAL_API_KEY) {
      headers['x-api-key'] = INTERNAL_API_KEY.trim();
>>>>>>> parent of 02b9e014 (Oggikinssss)
    }

    const depositRes = await fetch(
      `${APP_INTERNAL_API}/wallet/deposit/system`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(depositPayload),
      }
    );
<<<<<<< HEAD
  } catch (err: any) {
    console.error('[create-payment] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 200 }
=======

    const depositData = await depositRes.json().catch(() => ({}));

    if (!depositRes.ok || !depositData?.success) {
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
>>>>>>> parent of 02b9e014 (Oggikinssss)
    );
  }
}
