// src/hooks/useSellerWallet.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { securityService } from '@/services/security.service';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { financialSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

// Define withdrawal limits
const WITHDRAWAL_LIMITS = {
  MIN_AMOUNT: 10, // Minimum $10
  MAX_AMOUNT: 5000, // Maximum $5000 per withdrawal
  DAILY_LIMIT: 10000, // Maximum $10000 per day
  MIN_BALANCE_REMAINING: 0, // Can withdraw entire balance
};

// Withdrawal validation schema
const WithdrawalSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(WITHDRAWAL_LIMITS.MIN_AMOUNT, `Minimum withdrawal is $${WITHDRAWAL_LIMITS.MIN_AMOUNT}`)
    .max(WITHDRAWAL_LIMITS.MAX_AMOUNT, `Maximum withdrawal is $${WITHDRAWAL_LIMITS.MAX_AMOUNT}`)
    .refine(val => Math.round(val * 100) / 100 === val, 'Amount must have at most 2 decimal places'),
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
    
    // Validate withdrawal entries
    return userWithdrawals.filter(withdrawal => {
      return withdrawal.amount > 0 && 
             withdrawal.date && 
             !isNaN(new Date(withdrawal.date).getTime());
    });
  }, [user?.username, sellerWithdrawals]);
  
  // Sort withdrawals by date (newest first) with error handling
  const sortedWithdrawals = useMemo(() => {
    try {
      return [...logs].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error sorting withdrawals:', error);
      return logs;
    }
  }, [logs]);
  
  // Get recent withdrawals (last 5)
  const recentWithdrawals = useMemo(() => 
    sortedWithdrawals.slice(0, 5), 
    [sortedWithdrawals]
  );
  
  // Calculate total withdrawn with validation
  const totalWithdrawn = useMemo(() => {
    const total = logs.reduce((sum, log) => {
      const amount = typeof log.amount === 'number' ? log.amount : 0;
      return sum + Math.max(0, amount); // Ensure non-negative
    }, 0);
    
    return Math.round(total * 100) / 100; // Round to 2 decimals
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
    
    return orderHistory.filter(order => 
      order.seller === user.username
      // Removed status check since Order type doesn't have status property
    );
  }, [user?.username, orderHistory]);
  
  // Calculate total earnings (including current balance)
  const totalEarnings = useMemo(() => {
    const earnings = balance + totalWithdrawn;
    return Math.round(earnings * 100) / 100; // Round to 2 decimals
  }, [balance, totalWithdrawn]);

  // Update balance with validation - FIXED to handle various data formats
  useEffect(() => {
    if (user?.username) {
      // Try multiple methods to get the balance
      let raw: any = null;
      
      // Method 1: Try getSellerBalance function
      try {
        raw = getSellerBalance(user.username);
      } catch (error) {
        console.error('Error calling getSellerBalance:', error);
      }
      
      // Method 2: If that fails or returns invalid data, try sellerBalances directly
      if (typeof raw !== 'number' || isNaN(raw)) {
        raw = sellerBalances?.[user.username];
      }
      
      // Now process the raw value
      let numericBalance = 0;
      
      if (typeof raw === 'number' && !isNaN(raw)) {
        // It's already a valid number
        numericBalance = raw;
      } else if (raw && typeof raw === 'object') {
        // It might be an object with a balance property
        if ('balance' in raw && typeof raw.balance === 'number' && !isNaN(raw.balance)) {
          numericBalance = raw.balance;
        } else if ('amount' in raw && typeof raw.amount === 'number' && !isNaN(raw.amount)) {
          numericBalance = raw.amount;
        } else {
          // Try to find any numeric property
          const numericValue = Object.values(raw).find(val => typeof val === 'number' && !isNaN(val as number));
          if (numericValue !== undefined) {
            numericBalance = numericValue as number;
          }
        }
      }
      
      // Ensure the balance is valid and non-negative
      if (numericBalance < 0) {
        console.warn('Negative balance detected, setting to 0');
        numericBalance = 0;
      }
      
      // Round to 2 decimal places and set
      const finalBalance = Math.round(numericBalance * 100) / 100;
      setBalance(finalBalance);
      
      if (finalBalance === 0 && raw !== 0) {
        console.warn('Balance defaulted to 0, raw value was:', raw);
      }
    }
  }, [user, getSellerBalance, sellerBalances, logs]);

  // Handle amount change with validation
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValidationError(null);
    
    // Allow empty string
    if (value === '') {
      setWithdrawAmount('');
      return;
    }
    
    // Validate format (numbers and decimal point only)
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return; // Don't update if invalid format
    }
    
    // Prevent leading zeros except for decimals
    if (/^0[0-9]/.test(value)) {
      return;
    }
    
    setWithdrawAmount(value);
    
    // Validate amount if it's a complete number
    if (value && !value.endsWith('.')) {
      const amount = parseFloat(value);
      
      if (!isNaN(amount)) {
        try {
          WithdrawalSchema.shape.amount.parse(amount);
          
          // Check daily limit
          if (todaysWithdrawals + amount > WITHDRAWAL_LIMITS.DAILY_LIMIT) {
            setValidationError(
              `Daily limit exceeded. You can withdraw up to $${
                (WITHDRAWAL_LIMITS.DAILY_LIMIT - todaysWithdrawals).toFixed(2)
              } today.`
            );
          }
          
          // Check balance
          if (amount > balance) {
            setValidationError('Insufficient balance');
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            setValidationError(error.errors[0].message);
          }
        }
      }
    }
  }, [balance, todaysWithdrawals]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !validationError) {
      handleWithdrawClick();
    }
  }, [validationError]);

  const handleQuickAmountSelect = useCallback((amount: string) => {
    // Validate quick amount
    const numAmount = parseFloat(amount);
    
    if (!isNaN(numAmount) && numAmount > 0) {
      // Check if amount exceeds balance
      if (numAmount > balance) {
        setValidationError('Insufficient balance');
        setWithdrawAmount(balance.toFixed(2));
      } else {
        setWithdrawAmount(amount);
        setValidationError(null);
        
        // Validate against limits
        try {
          WithdrawalSchema.shape.amount.parse(numAmount);
          
          // Check daily limit
          if (todaysWithdrawals + numAmount > WITHDRAWAL_LIMITS.DAILY_LIMIT) {
            setValidationError(
              `Daily limit exceeded. You can withdraw up to $${
                (WITHDRAWAL_LIMITS.DAILY_LIMIT - todaysWithdrawals).toFixed(2)
              } today.`
            );
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            setValidationError(error.errors[0].message);
          }
        }
      }
    }
  }, [balance, todaysWithdrawals]);

  const handleWithdrawClick = useCallback(() => {
    if (!user?.username) {
      setMessage('Please log in to withdraw funds.');
      setMessageType('error');
      return;
    }

    // Clear previous messages
    setMessage('');
    setMessageType('');
    
    // Validate amount
    const amount = parseFloat(withdrawAmount);
    
    try {
      // Parse and validate
      const validatedAmount = WithdrawalSchema.shape.amount.parse(amount);
      
      // Check balance
      if (validatedAmount > balance) {
        throw new Error('Insufficient balance');
      }
      
      // Check daily limit
      if (todaysWithdrawals + validatedAmount > WITHDRAWAL_LIMITS.DAILY_LIMIT) {
        throw new Error(
          `Daily limit exceeded. You can withdraw up to $${
            (WITHDRAWAL_LIMITS.DAILY_LIMIT - todaysWithdrawals).toFixed(2)
          } today.`
        );
      }
      
      // Check rate limit
      const rateLimitResult = checkWithdrawalLimit(user.username);
      if (!rateLimitResult.allowed) {
        throw new Error(
          `Too many withdrawal attempts. Please wait ${rateLimitResult.waitTime} seconds.`
        );
      }
      
      setShowConfirmation(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid withdrawal amount';
      setMessage(errorMessage);
      setMessageType('error');
      setValidationError(errorMessage);
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  }, [user, withdrawAmount, balance, todaysWithdrawals, checkWithdrawalLimit]);

  const handleConfirmWithdraw = useCallback(() => {
    if (!user?.username) return;
    
    setIsLoading(true);
    const amount = parseFloat(withdrawAmount);
    
    // Final validation with sanitization
    const sanitizedAmount = sanitizeCurrency(amount);
    
    try {
      // Double-check validation
      WithdrawalSchema.shape.amount.parse(sanitizedAmount);
      
      if (sanitizedAmount > balance) {
        throw new Error('Insufficient balance');
      }
      
      // Simulate processing delay for better UX
      setTimeout(() => {
        try {
          // Add withdrawal
          addSellerWithdrawal(user.username, sanitizedAmount);
          
          setMessage(`Successfully withdrew $${sanitizedAmount.toFixed(2)}.`);
          setMessageType('success');
          setWithdrawAmount('');
          setShowConfirmation(false);
          setValidationError(null);
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 5000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed';
          setMessage(`Error: ${errorMessage}`);
          setMessageType('error');
          
          // Clear error message after 5 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 5000);
        } finally {
          setIsLoading(false);
        }
      }, 800);
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Invalid withdrawal'}`);
      setMessageType('error');
      setIsLoading(false);
      setShowConfirmation(false);
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  }, [user, withdrawAmount, balance, addSellerWithdrawal]);

  // Cancel withdrawal
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
