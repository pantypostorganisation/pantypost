// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * NOWPayments webhook handler
 * - Validates the payload from NOWPayments
 * - Checks payment status == "finished"
 * - Credits the buyer's wallet via internal API
 */

const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || "";
const APP_INTERNAL_API = process.env.NEXT_PUBLIC_API_URL || "https://api.pantypost.com/api";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const rawBody = JSON.parse(bodyText);

    // ✅ Step 1 — Validate secret if configured
    if (NOWPAYMENTS_IPN_SECRET) {
      const receivedHmac = req.headers.get("x-nowpayments-sig");
      const computedHmac = crypto
        .createHmac("sha512", NOWPAYMENTS_IPN_SECRET)
        .update(bodyText)
        .digest("hex");

      if (receivedHmac !== computedHmac) {
        console.error("[Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    console.log("[Webhook] Received NOWPayments IPN:", rawBody);

    // ✅ Step 2 — Only process successful payments
    const status = rawBody.payment_status?.toLowerCase();
    if (status !== "finished") {
      console.log(`[Webhook] Ignoring non-final status: ${status}`);
      return NextResponse.json({ ignored: true, status });
    }

    const orderId = rawBody.order_id || "unknown";
    const amountUSD = Number(rawBody.price_amount || 0);

    if (!orderId.startsWith("pp-deposit-")) {
      console.log("[Webhook] Ignoring unrelated order_id:", orderId);
      return NextResponse.json({ ignored: true });
    }

    // ✅ Step 3 — Extract username (you can add metadata in the future)
    // For now, we assign it to a "pending" queue or a known buyer if you track sessions
    const username = rawBody?.customer_email || "buyer1"; // <-- replace with real mapping if you pass buyer info

    // ✅ Step 4 — Credit buyer's wallet via backend API
    const depositPayload = {
      username,
      amount: amountUSD,
      method: "crypto",
      notes: `NOWPayments deposit (${orderId})`,
    };

    const response = await fetch(`${APP_INTERNAL_API}/wallet/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(depositPayload),
    });

    const data = await response.json();
    console.log("[Webhook] Deposit API response:", data);

    if (!response.ok) {
      throw new Error(`Deposit API failed: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing IPN:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
