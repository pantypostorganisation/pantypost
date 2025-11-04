// src/app/api/crypto/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const NOWPAYMENTS_ENDPOINT = 'https://api.nowpayments.io/v1/payment';
const NOWPAYMENTS_ESTIMATE_ENDPOINT = 'https://api.nowpayments.io/v1/estimate';
const RATE_BUFFER = 0.0025; // 0.25% buffer for rate fluctuations

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

// Check the exchange rate before creating payment
async function checkExchangeRate(amount: number, apiKey: string): Promise<{
  estimatedUsdt: number;
  bufferedUsdt: number;
  exchangeRate: number;
  isReasonable: boolean;
}> {
  try {
    const estimateUrl = `${NOWPAYMENTS_ESTIMATE_ENDPOINT}?amount=${amount}&currency_from=usd&currency_to=usdttrc20`;
    
    const response = await fetch(estimateUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get rate estimate');
    }

    const data = await response.json();
    const estimatedUsdt = parseFloat(data.estimated_amount);
    
    // Add 0.25% buffer to protect against rate changes
    const bufferedUsdt = estimatedUsdt * (1 + RATE_BUFFER);
    
    const exchangeRate = amount / estimatedUsdt; // How many USD per USDT
    
    // Check if rate is reasonable (USDT should be 0.98-1.02 USD)
    const isReasonable = exchangeRate >= 0.98 && exchangeRate <= 1.02;
    
    console.log('[NOWPayments] Rate check with buffer:', {
      usdAmount: amount,
      estimatedUsdt: estimatedUsdt.toFixed(6),
      bufferedUsdt: bufferedUsdt.toFixed(6),
      bufferAmount: (bufferedUsdt - estimatedUsdt).toFixed(6),
      exchangeRate: exchangeRate.toFixed(4),
      isReasonable,
      percentDiff: ((Math.abs(1 - exchangeRate) * 100).toFixed(2)) + '%'
    });

    return {
      estimatedUsdt,
      bufferedUsdt,
      exchangeRate,
      isReasonable,
    };
  } catch (error) {
    console.error('[NOWPayments] Rate check failed:', error);
    throw error;
  }
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
    
    // Check if this is just a rate check request
    const isRateCheckOnly = body?.rateCheckOnly === true;

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

    // ALWAYS check the exchange rate first
    let rateInfo;
    try {
      rateInfo = await checkExchangeRate(amount, apiKey);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to check exchange rates. Please try again.',
          code: 'RATE_CHECK_FAILED',
        },
        { status: 500 }
      );
    }

    // If rate is unreasonable, warn the user
    if (!rateInfo.isReasonable) {
      const percentOff = Math.abs((1 - rateInfo.exchangeRate) * 100).toFixed(1);
      console.warn('[NOWPayments] Unreasonable exchange rate detected:', {
        rate: rateInfo.exchangeRate,
        percentOff: percentOff + '%'
      });
      
      // Reject if rate is more than 5% off
      if (parseFloat(percentOff) > 5) {
        return NextResponse.json(
          {
            success: false,
            error: `Exchange rate is ${percentOff}% off market rate. Please try again later.`,
            code: 'BAD_EXCHANGE_RATE',
            details: {
              expectedUsdt: amount,
              actualUsdt: rateInfo.estimatedUsdt,
              exchangeRate: rateInfo.exchangeRate,
            }
          },
          { status: 400 }
        );
      }
    }

    // If this is just a rate check, return the rate info with buffer
    if (isRateCheckOnly) {
      return NextResponse.json(
        {
          success: true,
          data: {
            usdAmount: amount,
            usdtRequired: rateInfo.bufferedUsdt,  // Return buffered amount
            usdtEstimated: rateInfo.estimatedUsdt, // Original estimate
            buffer: `${(RATE_BUFFER * 100).toFixed(2)}%`,
            exchangeRate: rateInfo.exchangeRate,
            isReasonable: rateInfo.isReasonable,
            percentDiff: ((Math.abs(1 - rateInfo.exchangeRate) * 100).toFixed(2)) + '%',
            note: 'Amount includes 0.25% buffer for rate fluctuations'
          }
        },
        { status: 200 }
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
      estimatedUsdt: rateInfo.estimatedUsdt.toFixed(6),
      bufferedUsdt: rateInfo.bufferedUsdt.toFixed(6),
    });

    // Create the payment with the BUFFERED amount to protect against rate changes
    // We ask for slightly more USDT to ensure the USD value is covered
    const adjustedUsdAmount = amount * (1 + RATE_BUFFER);
    
    const paymentPayload: Record<string, unknown> = {
      price_amount: adjustedUsdAmount,  // Request slightly more to cover fluctuations
      price_currency: 'usd',
      pay_currency: 'usdttrc20',  // FORCE USDT TRC-20 ONLY
      order_id: orderId,
      order_description: description,
      ipn_callback_url: `${appUrl}/api/crypto/webhook`,
      success_url: `${appUrl}/wallet/buyer?deposit=success&order=${orderId}`,
      cancel_url: `${appUrl}/wallet/buyer?deposit=cancelled`,
      is_fixed_rate: false,  // Use floating rate for fair pricing
      is_fee_paid_by_user: false,
      type: 'Standard',
      case: 'payment',
      metadata: {
        original_amount: amount,
        buffer_applied: RATE_BUFFER,
      }
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

    // Get the actual payment amount
    const actualPayAmount = parseFloat(paymentData.pay_amount);
    
    // Log the difference for monitoring
    console.log('[NOWPayments] Payment created with buffer:', {
      originalEstimate: rateInfo.estimatedUsdt.toFixed(6),
      bufferedEstimate: rateInfo.bufferedUsdt.toFixed(6),
      actualPayAmount: actualPayAmount.toFixed(6),
      difference: (actualPayAmount - rateInfo.estimatedUsdt).toFixed(6),
      bufferUsed: ((actualPayAmount - rateInfo.estimatedUsdt) / rateInfo.estimatedUsdt * 100).toFixed(3) + '%'
    });

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
      console.log('[NOWPayments] USDT direct payment created:', {
        address: paymentData.pay_address,
        amount: actualPayAmount,
        originalUsdAmount: amount,
        buffer: `${(RATE_BUFFER * 100).toFixed(2)}%`,
      });
      
      // Return structured response for manual USDT payment
      return NextResponse.json(
        {
          success: true,
          data: {
            payment_id: paymentData.payment_id,
            pay_address: paymentData.pay_address,
            pay_amount: actualPayAmount,
            pay_currency: 'USDT (TRC-20)',
            payment_status: paymentData.payment_status,
            order_id: orderId,
            type: 'manual_payment',
            network: 'TRC-20',
            instructions: `Please send exactly ${actualPayAmount} USDT to the TRC-20 address provided`,
            expiry_time: paymentData.expiry_estimate_date,
            exchange_rate: rateInfo.exchangeRate,
            usd_amount: amount,  // Original amount user wanted to deposit
            buffer_note: 'Amount includes 0.25% buffer for rate protection',
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
            amount: amount,  // Original USD amount
            order_id: orderId,
            type: 'hosted_checkout',
            currency: 'USDT (TRC-20)',
            warning: 'Only send USDT on TRC-20 network!',
            exchange_rate: rateInfo.exchangeRate,
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