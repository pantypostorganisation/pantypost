// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * NOWPayments webhook handler for PantyPost
 * - verifies (optionally) the NOWPayments signature
 * - checks payment_status == "finished"
 * - extracts username from order_id or customer_email
 * - sends deposit to backend wallet API
 *
 * Notes:
 * - To make local / curl testing easier, you can set:
 *   ALLOW_UNVERIFIED_IPN=true
 *   in your .env.production to skip signature check temporarily.
 */

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";
const APP_INTERNAL_API =
  process.env.NEXT_PUBLIC_API_URL || "https://api.pantypost.com/api";
const ALLOW_UNVERIFIED_IPN =
  process.env.ALLOW_UNVERIFIED_IPN === "true" ? true : false;

function verifySignature(rawBody: string, headerSig: string | null): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) return true; // no secret set, allow
  if (!headerSig) return false;

  const computed = crypto
    .createHmac("sha512", NOWPAYMENTS_IPN_SECRET)
    .update(rawBody)
    .digest("hex");

  // NOWPayments sends lowercase hex, so compare as lowercase
  return computed.toLowerCase() === headerSig.toLowerCase();
}

function extractUsername(payload: any): string {
  // 1) Best: encode username in order_id like: pp-deposit-oakley-<timestamp>
  const orderId: string = payload?.order_id || "";
  if (orderId.startsWith("pp-deposit-")) {
    // pp-deposit-<maybe-username>-...
    const parts = orderId.split("-");
    // ["pp", "deposit", "oakley", "1762175531922"]
    if (parts.length >= 3) {
      return parts[2]; // "oakley"
    }
  }

  // 2) Try customer_email if you set it in create-payment
  const email: string | undefined = payload?.customer_email;
  if (email) {
    // you can map email -> username in your backend later
    return email;
  }

  // 3) Fallback to a known test user
  return "buyer1";
}

export async function POST(req: NextRequest) {
  try {
    // we need raw text to verify signature
    const bodyText = await req.text();
    const headerSig = req.headers.get("x-nowpayments-sig");

    const isValid = verifySignature(bodyText, headerSig);

    if (!isValid && !ALLOW_UNVERIFIED_IPN) {
      console.error("[Webhook] Invalid signature, rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    console.log("[Webhook] Received IPN:", payload);

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

    // prepare deposit body for your backend
    const depositPayload = {
      username,
      amount: amountUSD,
      method: "crypto",
      notes: `NOWPayments deposit (${orderId})`,
    };

    // send to your backend API to actually credit wallet
    const depositRes = await fetch(`${APP_INTERNAL_API}/wallet/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(depositPayload),
    });

    const depositData = await depositRes.json();

    if (!depositRes.ok) {
      console.error("[Webhook] Deposit failed:", depositData);
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
