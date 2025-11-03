// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';

export async function POST(req: NextRequest) {
  try {
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

    // Basic validation
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Send { "amount": 25 }' },
        { status: 200 }
      );
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'NOWPAYMENTS_API_KEY is not set on the server',
        },
        { status: 200 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
      'https://pantypost.com';

    // Order ID is what ties the deposit to a username
    const orderId =
      frontendOrderId && frontendOrderId.length > 0
        ? frontendOrderId
        : `pp-deposit-${Date.now()}`;

    // Construct NOWPayments payload
    const payload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer/?deposit=success`,
      cancel_url: `${appUrl}/wallet/buyer/?deposit=cancelled`,
    };

    if (payCurrency) {
      payload['pay_currency'] = payCurrency;
    }

    // NOTE: Do not forward body.metadata — NOWPayments rejects it
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
  } catch (err: any) {
    console.error('[create-payment] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 200 }
    );
  }
}
