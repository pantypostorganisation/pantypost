// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from "next/server";

const NOWPAYMENTS_ENDPOINT = "https://api.nowpayments.io/v1/payment";

function getApiKey() {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new Error("NOWPAYMENTS_API_KEY is not set in .env.local");
  }
  return key;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);

    // basic validation
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Send JSON like { \"amount\": 25 }" },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();

    // base URL for redirects + webhook
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
      "http://localhost:3000";

    const payload = {
      price_amount: amount, // user wants to deposit this much
      price_currency: "usd", // change later if you price in AUD
      pay_currency: "usdttrc20", // your chosen receiving currency
      order_id: `pp-deposit-${Date.now()}`,
      order_description: "PantyPost wallet deposit",
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/purchase-success`,
      cancel_url: `${appUrl}/wallet/buyer`,
    };

    const res = await fetch(NOWPAYMENTS_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "NOWPayments create payment failed",
          details: data,
        },
        { status: 500 }
      );
    }

    // this is what your frontend needs
    return NextResponse.json(
      {
        paymentId: data.payment_id,
        checkoutUrl: data.checkout_url,
        raw: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[create-payment] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
