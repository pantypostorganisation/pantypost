// src/hooks/useSellerWallet.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { z } from 'zod';

// Define withdrawal limits
const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 20, // Minimum $20 (aligned with backend)
  MAX_AMOUNT: 10000, // Maximum $10,000 per withdrawal (aligned with backend)
  DAILY_LIMIT: 10000, // Maximum $10,000 per day
  MIN_BALANCE_REMAINING: 0, // Can withdraw entire balance
};

// Withdrawal validation schema
const WithdrawalSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(
      WITHDRAWAL_LIMITS.MIN_AMOUNT,
      `Withdrawal amount minimum is $${WITHDRAWAL_LIMITS.MIN_AMOUNT}`
    )
    .max(
      WITHDRAWAL_LIMITS.MAX_AMOUNT,
      `Maximum withdrawal is $${WITHDRAWAL_LIMITS.MAX_AMOUNT}`
    )
    .refine(
      (val) => Math.round(val * 100) / 100 === val,
      'Amount must have at most 2 decimal places'
    ),
});

export function useSellerWallet() {
  const { user } = useAuth();
  const { 
    getSellerBalance, 
    addSellerWithdrawal, 
    sellerWithdrawals, 
    orderHistory,
    sellerBalances 
  } = useWallet();

  // Rate limiting for withdrawals
  const { checkLimit: checkWithdrawalLimit } = useRateLimit('WITHDRAWAL', {
    maxAttempts: 3,
    windowMs: 24 * 60 * 60 * 1000 // 24 hours
  });

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Memoize withdrawal logs with validation
  const logs = useMemo(() => {
    if (!user?.username) return [];
    const userWithdrawals = sellerWithdrawals[user.username] || [];
    return userWithdrawals.filter(withdrawal => {
      return (
        withdrawal.amount > 0 &&
        withdrawal.date &&
        !isNaN(new Date(withdrawal.date).getTime())
      );
    });
  }, [user?.username, sellerWithdrawals]);
  
  // Sort withdrawals by date (newest first) with error handling
  const sortedWithdrawals = useMemo(() => {
    try {
      return [...logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error sorting withdrawals:', error);
      return logs;
    }
  }, [logs]);
  
  // Get recent withdrawals (last 5)
  const recentWithdrawals = useMemo(
    () => sortedWithdrawals.slice(0, 5),
    [sortedWithdrawals]
  );
  
  // Calculate total withdrawn with validation
  const totalWithdrawn = useMemo(() => {
    const total = logs.reduce((sum, log) => {
      const amount = typeof log.amount === 'number' ? log.amount : 0;
      return sum + Math.max(0, amount);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [logs]);
  
  // Calculate today's withdrawals for daily limit
  const todaysWithdrawals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return logs
      .filter(log => new Date(log.date) >= today)
      .reduce((sum, log) => sum + log.amount, 0);
  }, [logs]);
  
  // Get seller's sales history with validation
  const sellerSales = useMemo(() => {
    if (!user?.username) return [];
    return orderHistory.filter(
      order =>
        order.seller === user.username &&
        order.buyer !== 'platform' &&
        order.shippingStatus !== 'pending-auction'
    );
  }, [user?.username, orderHistory]);
  
  // Calculate total earnings from completed sales
  const totalEarnings = useMemo(() => {
    if (!user?.username) return 0;
    const salesTotal = sellerSales.reduce((sum, sale) => {
      const basePrice = sale.wasAuction ? (sale.finalBid || sale.price) : sale.price;
      const sellerCut = basePrice * 0.9;
      const tierCredit = sale.tierCreditAmount || 0;
      const totalForSale = sellerCut + tierCredit;
      return sum + Math.max(0, totalForSale);
    }, 0);
    return Math.round(salesTotal * 100) / 100;
  }, [sellerSales, user?.username]);

  // Update balance with validation
  useEffect(() => {
    if (user?.username) {
      let raw: any = null;
      try {
        raw = getSellerBalance(user.username);
      } catch (error) {
        console.error('Error calling getSellerBalance:', error);
      }
      if (typeof raw !== 'number' || isNaN(raw)) {
        raw = sellerBalances?.[user.username];
      }
      let numericBalance = 0;
      if (typeof raw === 'number' && !isNaN(raw)) {
        numericBalance = raw;
      } else if (raw && typeof raw === 'object') {
        if ('balance' in raw && typeof (raw as any).balance === 'number' && !isNaN((raw as any).balance)) {
          numericBalance = (raw as any).balance;
        } else if ('amount' in raw && typeof (raw as any).amount === 'number' && !isNaN((raw as any).amount)) {
          numericBalance = (raw as any).amount;
        } else {
          const numericValue = Object.values(raw).find(
            val => typeof val === 'number' && !isNaN(val as number)
          );
          if (numericValue !== undefined) numericBalance = numericValue as number;
        }
      }
      if (numericBalance < 0) {
        console.warn('Negative balance detected, setting to 0');
        numericBalance = 0;
      }
      const finalBalance = Math.round(numericBalance * 100) / 100;
      setBalance(finalBalance);
      if (finalBalance === 0 && raw !== 0) {
        console.warn('Balance defaulted to 0, raw value was:', raw);
      }
    }
  }, [user, getSellerBalance, sellerBalances, logs]);

  /**
   * WITHDRAW CLICK: perform full validation here (not on each keystroke).
   * (Declared BEFORE handleKeyPress to avoid TDZ errors.)
   */
  const handleWithdrawClick = useCallback(() => {
    if (!user?.username) {
      setMessage('Please log in to withdraw funds.');
      setMessageType('error');
      return;
    }

    setMessage('');
    setMessageType('');
    setValidationError(null);

    const amount = parseFloat(withdrawAmount);

    try {
      const validatedAmount = WithdrawalSchema.shape.amount.parse(amount);

      if (validatedAmount > balance) {
        throw new Error('Insufficient balance');
      }

      if (todaysWithdrawals + validatedAmount > WITHDRAWAL_LIMITS.DAILY_LIMIT) {
        throw new Error(
          `Daily limit exceeded. You can withdraw up to $${
            (WITHDRAWAL_LIMITS.DAILY_LIMIT - todaysWithdrawals).toFixed(2)
          } today.`
        );
      }

      const rateLimitResult = checkWithdrawalLimit(user.username);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Too many withdrawal attempts. Please wait ${rateLimitResult.waitTime} seconds.`
        );
      }

      setShowConfirmation(true);
    } catch (error) {
      const errorMessage = error instanceof z.ZodError
        ? (error.errors?.[0]?.message ?? 'Invalid withdrawal amount')
        : (error as Error).message;

      setValidationError(errorMessage);
      setMessage(errorMessage);
      setMessageType('error');

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  }, [user, withdrawAmount, balance, todaysWithdrawals, checkWithdrawalLimit]);

  /**
   * INPUT CHANGE: no inline validation while typing.
   */
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Clear any old errors while typing
    setValidationError(null);
    setMessage('');
    setMessageType('');

    // Allow empty string
    if (value === '') {
      setWithdrawAmount('');
      return;
    }

    // Validate format (digits + optional . with up to 2 decimals)
    if (!/^\d*\.?\d{0,2}$/.test(value)) return;

    // Prevent leading zeros like "05"
    if (/^0[0-9]/.test(value)) return;

    setWithdrawAmount(value);
  }, []);

  /**
   * QUICK AMOUNT: set value without triggering validation errors.
   * If over balance, cap to balance (no inline error).
   */
  const handleQuickAmountSelect = useCallback((amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const capped = Math.min(numAmount, Math.max(0, balance));
    setWithdrawAmount(capped.toFixed(2));

    // Clear any previous visible errors
    setValidationError(null);
    setMessage('');
    setMessageType('');
  }, [balance]);

  /**
   * KEY PRESS: only triggers submit; declared AFTER handleWithdrawClick.
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleWithdrawClick();
    }
  }, [handleWithdrawClick]);

  const handleConfirmWithdraw = useCallback(async () => {
    if (!user?.username) return;
    
    setIsLoading(true);
    const amount = parseFloat(withdrawAmount);
    const sanitizedAmount = sanitizeCurrency(amount);

    try {
      WithdrawalSchema.shape.amount.parse(sanitizedAmount);
      if (sanitizedAmount > balance) {
        throw new Error('Insufficient balance');
      }

      await addSellerWithdrawal(user.username, sanitizedAmount);

      setBalance(prev => prev - sanitizedAmount);
      setMessage(`Successfully withdrew $${sanitizedAmount.toFixed(2)}.`);
      setMessageType('success');
      setWithdrawAmount('');
      setShowConfirmation(false);
      setValidationError(null);

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
      setMessage(`Error: ${errorMessage}`);
      setMessageType('error');
      setShowConfirmation(false);

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, [user, withdrawAmount, balance, addSellerWithdrawal]);

  const handleCancelWithdraw = useCallback(() => {
    setShowConfirmation(false);
    setValidationError(null);
  }, []);

  return {
    // State
    balance,
    withdrawAmount,
    message,
    messageType,
    isLoading,
    showConfirmation,
    validationError,
    
    // Computed values
    sortedWithdrawals,
    totalWithdrawn,
    totalEarnings,
    recentWithdrawals,
    sellerSales,
    todaysWithdrawals,
    
    // Limits
    withdrawalLimits: WITHDRAWAL_LIMITS,
    remainingDailyLimit: Math.max(0, WITHDRAWAL_LIMITS.DAILY_LIMIT - todaysWithdrawals),
    
    // Actions
    handleWithdrawClick,
    handleConfirmWithdraw,
    handleCancelWithdraw,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    setShowConfirmation,
    setWithdrawAmount
  };
}
