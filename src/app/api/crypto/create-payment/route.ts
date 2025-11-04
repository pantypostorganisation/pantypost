// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';

// Helper to validate if a string is a valid URL
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper to extract username from order ID
function extractUsernameFromOrderId(orderId: string): string {
  const patterns = [
    /^pp-deposit-([^-]+)-\d+$/,
    /^wallet-([^-]+)-\d+$/,
    /^deposit-([^-]+)-\d+$/,
  ];
  
  for (const pattern of patterns) {
    const match = orderId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return 'user';
}

// Create idempotency key for NOWPayments
function generateIdempotencyKey(orderId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${orderId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const amount = Number(body?.amount);
    const frontendOrderId = typeof body?.order_id === 'string' ? body.order_id : '';
    const description = typeof body?.description === 'string' 
      ? body.description 
      : 'PantyPost wallet deposit';

    // Input validation
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid amount. Minimum deposit is $10.00',
          code: 'INVALID_AMOUNT' 
        },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Minimum deposit amount is $10.00',
          code: 'AMOUNT_TOO_LOW' 
        },
        { status: 400 }
      );
    }

    if (amount > 10000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum deposit amount is $10,000.00',
          code: 'AMOUNT_TOO_HIGH' 
        },
        { status: 400 }
      );
    }

    // Check API key
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[NOWPayments] API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Payment system not configured. Please contact support.',
          code: 'CONFIG_ERROR',
        },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'https://pantypost.com';
    
    // Generate order ID with username extraction capability
    const username = extractUsernameFromOrderId(frontendOrderId) || 'unknown';
    const orderId = frontendOrderId || `pp-deposit-${username}-${Date.now()}`;
    
    console.log('[NOWPayments] Creating USDT-only payment for:', {
      username,
      amount,
      orderId,
      currency: 'usdttrc20',
    });

    // IMPORTANT: Skip invoice API and go directly to payment API for USDT-only
    // The invoice API doesn't strictly enforce pay_currency
    const paymentPayload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',  // FORCE USDT TRC-20 ONLY
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer?deposit=success&order=${orderId}`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
      is_fixed_rate: false,  // CHANGED TO FALSE for correct rates
      is_fee_paid_by_user: false,
      type: 'Standard',  // ADD THIS
      case: 'payment'   // ADD THIS
    };

    const paymentRes = await fetch(NOWPAYMENTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'x-idempotency-key': generateIdempotencyKey(orderId),
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paymentRes.json().catch(() => ({}));

    if (!paymentRes.ok) {
      console.error('[NOWPayments] Payment creation failed:', paymentData);
      
      // Parse NOWPayments error messages
      let errorMessage = 'Unable to create payment. Please try again.';
      if (paymentData?.message) {
        errorMessage = paymentData.message;
      } else if (paymentData?.error) {
        errorMessage = paymentData.error;
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: paymentData?.code || 'PAYMENT_CREATION_FAILED',
        },
        { status: 400 }
      );
    }

    // For USDT direct payments, we typically get a payment address
    // Check if we got a payment URL or just an address
    let paymentUrl = null;
    const possibleUrlFields = [
      'invoice_url',
      'payment_url', 
      'checkout_url',
      'hosted_checkout_url',
      'payment_link',
    ];

    for (const field of possibleUrlFields) {
      if (paymentData[field] && isValidUrl(paymentData[field])) {
        paymentUrl = paymentData[field];
        break;
      }
    }

    // If we got a payment address (typical for USDT direct payments)
    if (!paymentUrl && paymentData.pay_address) {
      console.log('[NOWPayments] USDT direct payment address:', paymentData.pay_address);
      
      // Return structured response for manual USDT payment
      // This is actually the expected flow for USDT-only payments
      return NextResponse.json(
        {
          success: true,
          data: {
            payment_id: paymentData.payment_id,
            pay_address: paymentData.pay_address,
            pay_amount: paymentData.pay_amount,
            pay_currency: 'USDT (TRC-20)',
            payment_status: paymentData.payment_status,
            order_id: orderId,
            type: 'manual_payment',
            network: 'TRC-20',
            instructions: `Please send exactly ${paymentData.pay_amount} USDT to the TRC-20 address provided`,
            expiry_time: paymentData.expiry_estimate_date,
          },
        },
        { status: 200 }
      );
    }

    // If we somehow got a hosted checkout URL (unlikely for direct USDT)
    if (paymentUrl) {
      console.log('[NOWPayments] Got payment URL for USDT:', paymentUrl);
      
      return NextResponse.json(
        {
          success: true,
          data: {
            payment_url: paymentUrl,
            payment_id: paymentData.payment_id,
            amount: amount,
            order_id: orderId,
            type: 'hosted_checkout',
            currency: 'USDT (TRC-20)',
            warning: 'Only send USDT on TRC-20 network!',
          },
        },
        { status: 200 }
      );
    }

    // Fallback error
    console.error('[NOWPayments] No payment method in response:', paymentData);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to create USDT payment. Please try again.',
        code: 'NO_PAYMENT_METHOD',
        details: {
          payment_id: paymentData.payment_id,
          status: paymentData.payment_status,
        },
      },
      { status: 500 }
    );
    
  } catch (err: any) {
    console.error('[NOWPayments] Unexpected error:', err);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}