// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';
const NOWPAYMENTS_INVOICE_ENDPOINT = 'https://api.nowpayments.io/v1/invoice';

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
  // Format: pp-deposit-USERNAME-timestamp or wallet-USERNAME-timestamp
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
  
  // Fallback to generic if can't extract
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
    const payCurrency = typeof body?.pay_currency === 'string' ? body.pay_currency : 'usdttrc20'; // Default to USDT-TRC20
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
    
    console.log('[NOWPayments] Creating payment for:', {
      username,
      amount,
      orderId,
      payCurrency,
    });

    // First, try to create an invoice (preferred for hosted checkout)
    try {
      const invoicePayload = {
        price_amount: amount,
        price_currency: 'usd',
        order_id: orderId,
        order_description: description,
        success_url: `${appUrl}/wallet/buyer?deposit=success&order=${orderId}`,
        cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
        ipn_callback_url: `${appUrl}/api/crypto/webhook`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      };

      const invoiceRes = await fetch(NOWPAYMENTS_INVOICE_ENDPOINT, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoicePayload),
      });

      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        
        // Check if we got a valid invoice URL
        if (invoiceData.invoice_url && isValidUrl(invoiceData.invoice_url)) {
          console.log('[NOWPayments] Invoice created successfully:', invoiceData.id);
          
          return NextResponse.json(
            {
              success: true,
              data: {
                payment_url: invoiceData.invoice_url,
                payment_id: invoiceData.id,
                invoice_id: invoiceData.id,
                amount: amount,
                order_id: orderId,
                type: 'invoice',
              },
            },
            { status: 200 }
          );
        }
      }
    } catch (invoiceError) {
      console.error('[NOWPayments] Invoice creation failed, falling back to payment:', invoiceError);
    }

    // Fallback to regular payment endpoint
    const paymentPayload: Record<string, unknown> = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer?deposit=success&order=${orderId}`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
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

    // Extract payment URL - check multiple possible fields
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

    // Check if we only got a payment address (not a hosted checkout URL)
    if (!paymentUrl && paymentData.pay_address) {
      console.log('[NOWPayments] No hosted checkout available, got payment address:', paymentData.pay_address);
      
      // Return structured response indicating manual payment is needed
      return NextResponse.json(
        {
          success: false,
          error: 'This payment method requires manual transfer. Hosted checkout is not available.',
          code: 'NO_HOSTED_CHECKOUT',
          data: {
            payment_id: paymentData.payment_id,
            pay_address: paymentData.pay_address,
            pay_amount: paymentData.pay_amount,
            pay_currency: paymentData.pay_currency,
            payment_status: paymentData.payment_status,
            order_id: orderId,
            type: 'manual_payment',
            instructions: `Please send exactly ${paymentData.pay_amount} ${paymentData.pay_currency} to address: ${paymentData.pay_address}`,
          },
        },
        { status: 200 }
      );
    }

    // If we still don't have a valid payment URL, return error
    if (!paymentUrl) {
      console.error('[NOWPayments] No valid payment URL in response:', paymentData);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Payment created but no checkout page available. Please try a different payment method.',
          code: 'NO_CHECKOUT_URL',
          details: {
            payment_id: paymentData.payment_id,
            status: paymentData.payment_status,
          },
        },
        { status: 200 }
      );
    }

    // Success - return the valid payment URL
    console.log('[NOWPayments] Payment created successfully:', {
      payment_id: paymentData.payment_id,
      url: paymentUrl,
      type: 'hosted_checkout',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_url: paymentUrl,
          payment_id: paymentData.payment_id,
          amount: amount,
          order_id: orderId,
          type: 'hosted_checkout',
          pay_currency: paymentData.pay_currency || payCurrency,
        },
      },
      { status: 200 }
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