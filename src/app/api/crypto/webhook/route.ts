// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";
const APP_INTERNAL_API =
  process.env.NEXT_PUBLIC_API_URL || "https://api.pantypost.com/api";
const ALLOW_UNVERIFIED_IPN =
  process.env.ALLOW_UNVERIFIED_IPN === "true" ? true : false;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

function verifySignature(rawBody: string, headerSig: string | null): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) return true;
  if (!headerSig) return false;

  const computed = crypto
    .createHmac("sha512", NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .digest("hex");

  return computed.toLowerCase() === headerSig.toLowerCase();
}

function extractUsername(payload: any): string {
  const orderId: string = payload?.order_id || "";
  if (orderId.startsWith("pp-deposit-")) {
    const parts = orderId.split("-");
    if (parts.length >= 3) {
      return parts[2]; // e.g. pp-deposit-oakley-123 -> oakley
    }
  }

  const email: string | undefined = payload?.customer_email;
  if (email) {
    return email;
  }

  return "buyer1";
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const headerSig = req.headers.get("x-nowpayments-sig");

    const isValid = verifySignature(bodyText, headerSig);
    if (!isValid && !ALLOW_UNVERIFIED_IPN) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const status: string | undefined = payload?.payment_status?.toLowerCase();

    if (status !== "finished") {
      return NextResponse.json(
        { ignored: true, reason: `status=${status}` },
        { status: 200 }
      );
    }

    const amountUSD = Number(payload?.price_amount || 0);
    if (!amountUSD || Number.isNaN(amountUSD)) {
      return NextResponse.json(
        { error: "Invalid amount from IPN" },
        { status: 400 }
      );
    }

    const username = extractUsername(payload);
    const orderId = payload?.order_id || "unknown";

    const depositPayload = {
      username,
      amount: amountUSD,
      method: "crypto",
      notes: `NOWPayments deposit (${orderId})`,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // add our internal key so backend knows it's our system calling
    if (INTERNAL_API_KEY) {
      headers["x-api-key"] = INTERNAL_API_KEY;
    }

    const depositRes = await fetch(`${APP_INTERNAL_API}/wallet/deposit`, {
      method: "POST",
      headers,
      body: JSON.stringify(depositPayload),
    });

    const depositData = await depositRes.json();

    if (!depositRes.ok) {
      return NextResponse.json(
        { error: "Failed to credit wallet", details: depositData },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
