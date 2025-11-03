// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';

function getApiKey() {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new Error('NOWPAYMENTS_API_KEY is not set in .env.local');
  }
  return key;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const amount = Number(body?.amount);
    const frontendOrderId = typeof body?.order_id === 'string' ? body.order_id : '';
    const payCurrency = body?.pay_currency || 'usdttrc20';
    const description =
      body?.description || 'PantyPost wallet deposit';
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : undefined;

    // basic validation
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Send JSON like { "amount": 25 }' },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();

    // base URL for redirects + webhook (trim trailing slash)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
      'http://localhost:3000';

    // we prefer the order_id from the frontend because we embed username in it
    const orderId = frontendOrderId && frontendOrderId.length > 0
      ? frontendOrderId
      : `pp-deposit-${Date.now()}`;

    const payload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      // send buyer back to wallet so we can show the success banner
      success_url: `${appUrl}/wallet/buyer?deposit=success`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
    };

    // if the caller sent metadata (e.g. { username, intent: 'wallet_deposit' }), pass it through
    if (metadata) {
      (payload as any).metadata = metadata;
    }

    const res = await fetch(NOWPAYMENTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[NOWPayments] create payment failed:', data);
      return NextResponse.json(
        {
          success: false,
          error: 'NOWPayments create payment failed',
          details: data,
        },
        { status: 500 }
      );
    }

    // NOWPayments sometimes returns different URL keys. Try the usual ones.
    const paymentUrl =
      data?.invoice_url ||
      data?.payment_url ||
      data?.checkout_url ||
      data?.pay_address;

    if (!paymentUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOWPayments did not return a payment URL',
          data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_url: paymentUrl,
          payment_id: data.payment_id,
          raw: data,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[create-payment] error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
