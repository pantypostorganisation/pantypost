// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const frontendOrderId =
      typeof body?.order_id === 'string' ? body.order_id : '';
    const payCurrency = body?.pay_currency || 'usdttrc20';
    const description =
      body?.description || 'PantyPost wallet deposit';

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Send JSON like { "amount": 25 }' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'NOWPAYMENTS_API_KEY is not set on the server. Add it to .env.production and redeploy.',
        },
        { status: 200 }
      );
    }

    // your real domain (you already have this in .env.production)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
      'https://pantypost.com';

    const orderId =
      frontendOrderId && frontendOrderId.length > 0
        ? frontendOrderId
        : `pp-deposit-${Date.now()}`;

    const payload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer?deposit=success`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
    };

    const res = await fetch(NOWPAYMENTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 🔴 HERE is the important change:
    // if NOWPayments says "no", we still return 200 so you can read `data`
    if (!res.ok) {
      console.error('[NOWPayments] create-payment failed:', data);
      return NextResponse.json(
        {
          success: false,
          error: data?.message || 'NOWPayments create payment failed',
          details: data,
          sent: payload,
        },
        { status: 200 }
      );
    }

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
          details: data,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_url: paymentUrl,
          payment_id: data.payment_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[create-payment] error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 200 }
    );
  }
}
