// src/app/api/crypto/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuration
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';
const APP_INTERNAL_API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'https://api.pantypost.com/api';
const ALLOW_UNVERIFIED_IPN = process.env.NODE_ENV === 'development' && process.env.ALLOW_UNVERIFIED_IPN === 'true';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

// In-memory store for idempotency (consider Redis for production)
const processedPayments = new Map<string, { timestamp: number; result: any }>();
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of processedPayments.entries()) {
    if (now - data.timestamp > IDEMPOTENCY_TTL_MS) {
      processedPayments.delete(id);
    }
  }
}, 1000 * 60 * 60); // Run every hour

/**
 * Verify NOWPayments IPN signature
 */
function verifySignature(rawBody: string, headerSig: string | null): boolean {
  // If secret not set, only allow in dev mode with explicit flag
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.warn('[Webhook] IPN secret not configured');
    return ALLOW_UNVERIFIED_IPN;
  }

  if (!headerSig) {
    console.warn('[Webhook] No signature in request headers');
    return false;
  }

  try {
    const computed = crypto
      .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computed.toLowerCase()),
      Buffer.from(headerSig.toLowerCase())
    );

    if (!isValid) {
      console.error('[Webhook] Signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * Extract username from order_id
 */
function extractUsername(payload: any): string {
  const orderId: string = payload?.order_id || '';

  // Expected formats:
  // pp-deposit-USERNAME-timestamp
  // wallet-USERNAME-timestamp
  // deposit-USERNAME-timestamp
  const patterns = [
    /^pp-deposit-([^-]+)-\d+$/,
    /^wallet-([^-]+)-\d+$/,
    /^deposit-([^-]+)-\d+$/,
  ];

  for (const pattern of patterns) {
    const match = orderId.match(pattern);
    if (match && match[1]) {
      console.log('[Webhook] Extracted username:', match[1], 'from order:', orderId);
      return match[1];
    }
  }

  // Fallback: check customer_email
  const email: string | undefined = payload?.customer_email;
  if (email) {
    // Extract username from email if possible
    const emailUsername = email.split('@')[0];
    console.log('[Webhook] Using email username:', emailUsername);
    return emailUsername;
  }

  console.warn('[Webhook] Could not extract username from order:', orderId);
  return 'unknown';
}

/**
 * Check for idempotent request
 */
function checkIdempotency(paymentId: string): { isDuplicate: boolean; cachedResult?: any } {
  if (!paymentId) return { isDuplicate: false };

  const cached = processedPayments.get(paymentId);
  
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < IDEMPOTENCY_TTL_MS) {
      console.log('[Webhook] Idempotent hit for payment:', paymentId);
      return { isDuplicate: true, cachedResult: cached.result };
    }
  }

  return { isDuplicate: false };
}

/**
 * Store processed payment for idempotency
 */
function storeProcessedPayment(paymentId: string, result: any): void {
  processedPayments.set(paymentId, {
    timestamp: Date.now(),
    result,
  });

  // Keep map size reasonable
  if (processedPayments.size > 10000) {
    // Remove oldest entries
    const entries = Array.from(processedPayments.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 1000
    for (let i = 0; i < 1000; i++) {
      processedPayments.delete(entries[i][0]);
    }
  }
}

/**
 * Validate payment status
 */
function isPaymentComplete(status: string): boolean {
  const completeStatuses = ['finished', 'completed', 'confirmed', 'sending', 'partially_paid'];
  return completeStatuses.includes(status.toLowerCase());
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Read raw body for signature verification
    const bodyText = await req.text();
    const headerSig = req.headers.get('x-nowpayments-sig');

    // Log webhook receipt
    console.log('[Webhook] Received NOWPayments IPN webhook', {
      hasSignature: !!headerSig,
      bodyLength: bodyText.length,
    });

    // Verify signature
    const isValid = verifySignature(bodyText, headerSig);
    if (!isValid && !ALLOW_UNVERIFIED_IPN) {
      console.error('[Webhook] Invalid signature - rejecting webhook');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!isValid && ALLOW_UNVERIFIED_IPN) {
      console.warn('[Webhook] Signature invalid but allowing in dev mode');
    }

    // Parse payload
    const payload = bodyText ? JSON.parse(bodyText) : {};
    
    // Extract key fields
    const paymentId: string = payload?.payment_id || payload?.invoice_id || '';
    const status: string = payload?.payment_status?.toLowerCase() || '';
    const orderId: string = payload?.order_id || '';
    
    console.log('[Webhook] Payment details:', {
      paymentId,
      status,
      orderId,
      amount: payload?.price_amount,
      currency: payload?.price_currency,
      actuallyPaid: payload?.actually_paid,
      outcome: payload?.outcome_amount,
    });

    // Check payment status
    if (!isPaymentComplete(status)) {
      console.log('[Webhook] Payment not complete, status:', status);
      return NextResponse.json(
        { 
          success: true,
          message: `Payment status: ${status}`,
          processed: false,
        },
        { status: 200 }
      );
    }

    // Check idempotency
    const { isDuplicate, cachedResult } = checkIdempotency(paymentId);
    if (isDuplicate) {
      return NextResponse.json(cachedResult || { success: true, idempotent: true }, { status: 200 });
    }

    // Extract and validate amount
    let amountUSD = Number(payload?.price_amount || 0);
    
    // Fallback to outcome_amount if price_amount not available
    if (!amountUSD && payload?.outcome_amount) {
      amountUSD = Number(payload.outcome_amount);
    }
    
    if (!amountUSD || Number.isNaN(amountUSD) || amountUSD <= 0) {
      console.error('[Webhook] Invalid amount:', payload?.price_amount);
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    // Extract username
    const username = extractUsername(payload);
    
    // Prepare internal API call
    const depositPayload = {
      username,
      amount: amountUSD,
      method: 'crypto',
      notes: `NOWPayments deposit (${orderId})`,
      txId: paymentId,
      orderId,
      source: 'nowpayments',
      metadata: {
        payment_id: paymentId,
        pay_currency: payload?.pay_currency,
        actually_paid: payload?.actually_paid,
        outcome_currency: payload?.outcome_currency,
        outcome_amount: payload?.outcome_amount,
        created_at: payload?.created_at,
        updated_at: payload?.updated_at,
      },
    };

    console.log('[Webhook] Crediting wallet:', {
      username,
      amount: amountUSD,
      orderId,
    });

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (INTERNAL_API_KEY) {
      headers['x-api-key'] = INTERNAL_API_KEY;
    }

    // Call internal API to credit wallet
    const depositEndpoint = `${APP_INTERNAL_API}/wallet/deposit/system`;
    
    const depositRes = await fetch(depositEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(depositPayload),
    });

    const depositData = await depositRes.json().catch(() => ({}));

    if (!depositRes.ok || !depositData?.success) {
      console.error('[Webhook] Failed to credit wallet:', {
        status: depositRes.status,
        error: depositData?.error,
        message: depositData?.message,
      });
      
      // Store failure for retry
      const errorResult = {
        success: false,
        error: 'Failed to credit wallet',
        details: depositData,
        retryable: true,
      };
      
      // Don't store in idempotency cache for failures
      
      return NextResponse.json(errorResult, { status: 500 });
    }

    // Success!
    const successResult = {
      success: true,
      processed: true,
      payment_id: paymentId,
      username,
      amount: amountUSD,
      transaction_id: depositData?.transaction?.id,
      balance: depositData?.newBalance,
      processingTime: Date.now() - startTime,
    };

    // Store for idempotency
    storeProcessedPayment(paymentId, successResult);

    console.log('[Webhook] Successfully processed payment:', {
      paymentId,
      username,
      amount: amountUSD,
      newBalance: depositData?.newBalance,
      processingTime: successResult.processingTime,
    });

    return NextResponse.json(successResult, { status: 200 });
    
  } catch (err) {
    console.error('[Webhook] Unexpected error:', err);
    
    // Don't expose internal errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests (for testing webhook endpoint)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'NOWPayments webhook endpoint',
      timestamp: new Date().toISOString(),
      configured: !!NOWPAYMENTS_IPN_SECRET,
    },
    { status: 200 }
  );
}

/**
 * Handle OPTIONS for CORS
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-nowpayments-sig',
    },
  });
}