// src/hooks/useBuyerWallet.ts

'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { WalletValidation } from '@/services/wallet.validation';
import { Money } from '@/types/common';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services';

interface EnhancedBuyerWalletState {
  balance: number;
  amountToAdd: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  walletUpdateTrigger: number;
  availableBalance: number;
  pendingBalance: number;
  dailyDepositLimit: number;
  remainingDepositLimit: number;
  transactionHistory: any[];
  isLoadingHistory: boolean;
  validationErrors: string[];
  lastSyncTime: Date | null;
  rateLimitError: string | null;
}

export const useBuyerWallet = () => {
  const { user } = useAuth();
  const { 
    getBuyerBalance,
    setBuyerBalance, 
    orderHistory,
    addDeposit,
    getTransactionHistory,
    checkSuspiciousActivity,
    buyerBalances,
    isInitialized: walletInitialized,
  } = useWallet();
  const toast = useToast();
  
  // Rate limiting
  const { checkLimit: checkDepositLimit } = useRateLimit('DEPOSIT');
  
  const [state, setState] = useState<EnhancedBuyerWalletState>({
    balance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    amountToAdd: '',
    message: '',
    messageType: '',
    isLoading: false,
    walletUpdateTrigger: 0,
    dailyDepositLimit: Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT),
    remainingDepositLimit: Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT),
    transactionHistory: [],
    isLoadingHistory: false,
    validationErrors: [],
    lastSyncTime: null,
    rateLimitError: null,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityCheckRef = useRef<Date>(new Date());
  const initialSyncDone = useRef(false);

  // Buyer purchases from order history
  const buyerPurchases = useMemo(() => {
    console.log('[BuyerWallet] Computing buyerPurchases:', {
      hasUser: !!user,
      username: user?.username,
      orderHistoryType: typeof orderHistory,
      orderHistoryIsArray: Array.isArray(orderHistory),
      orderHistoryLength: orderHistory?.length,
      orderHistory: orderHistory
    });
    
    if (!user?.username) {
      console.log('[BuyerWallet] No username, returning empty array');
      return [];
    }
    
    if (!orderHistory) {
      console.log('[BuyerWallet] orderHistory is null/undefined, returning empty array');
      return [];
    }
    
    if (!Array.isArray(orderHistory)) {
      console.log('[BuyerWallet] orderHistory is not an array, returning empty array');
      return [];
    }
    
    try {
      const filtered = orderHistory.filter(order => order && order.buyer === user.username);
      console.log('[BuyerWallet] Successfully filtered purchases:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('[BuyerWallet] Error filtering purchases:', error);
      return [];
    }
  }, [user?.username, orderHistory]);
  
  // Sort purchases by date (newest first)
  const recentPurchases = useMemo(() => {
    if (!Array.isArray(buyerPurchases) || buyerPurchases.length === 0) {
      return [];
    }
    
    try {
      return [...buyerPurchases]
        .sort((a, b) => {
          try {
            const aTime = new Date(a.date).getTime();
            const bTime = new Date(b.date).getTime();
            return bTime - aTime;
          } catch (error) {
            console.error('[BuyerWallet] Error sorting by date:', error);
            return 0;
          }
        })
        .slice(0, 3);
    } catch (error) {
      console.error('[BuyerWallet] Error processing recent purchases:', error);
      return [];
    }
  }, [buyerPurchases]);

  // Calculate total spent
  const totalSpent = useMemo(() => {
    if (!Array.isArray(buyerPurchases)) {
      return 0;
    }
    
    try {
      return buyerPurchases.reduce((sum, order) => {
        if (!order) return sum;
        
        const price = order.markedUpPrice || order.price;
        if (typeof price === 'number' && price > 0) {
          return sum + price;
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error('[BuyerWallet] Error calculating total spent:', error);
      return 0;
    }
  }, [buyerPurchases]);

  // Update state helper with sanitization
  const updateState = useCallback((updates: Partial<EnhancedBuyerWalletState>) => {
    setState(prev => {
      const sanitizedUpdates = { ...updates };
      if (updates.message) {
        sanitizedUpdates.message = sanitizeStrict(updates.message);
      }
      if (updates.rateLimitError) {
        sanitizedUpdates.rateLimitError = sanitizeStrict(updates.rateLimitError);
      }
      if (updates.validationErrors) {
        sanitizedUpdates.validationErrors = updates.validationErrors.map(err => sanitizeStrict(err));
      }
      return { ...prev, ...sanitizedUpdates };
    });
  }, []);

  // SERVER-SIDE ONLY: Get balance from WalletContext (no localStorage)
  const syncBalance = useCallback(async () => {
    console.log('[BuyerWallet] syncBalance called for user:', user?.username);
    if (!user?.username) return;

    try {
      // Get balance from WalletContext (which gets it from API)
      const balance = getBuyerBalance(user.username);
      console.log('[BuyerWallet] Context balance:', balance);
      
      // Update local state
      updateState({
        balance: balance,
        availableBalance: balance,
        lastSyncTime: new Date(),
      });
      
      // Get transaction history for additional info
      try {
        const history = await getTransactionHistory(user.username, 20);
        const transactionArray = Array.isArray(history) ? history : [];
        
        // Calculate daily limit usage
        const todaysDeposits = transactionArray.filter((t: any) => {
          const isDeposit = t.type === 'deposit' || (t.displayType === 'Deposit' && t.isCredit);
          const transactionDate = t.date || t.rawTransaction?.createdAt;
          if (!transactionDate) return false;
          const isToday = new Date(transactionDate).toDateString() === new Date().toDateString();
          return isDeposit && isToday;
        });
        
        const todaysDepositTotal = todaysDeposits.reduce((sum: number, t: any) => {
          const amount = t.amount || (t.rawTransaction?.amount ? Money.toDollars(t.rawTransaction.amount) : 0);
          if (typeof amount === 'number' && amount > 0) {
            return sum + amount;
          }
          return sum;
        }, 0);
        
        const remainingLimit = Money.toDollars(WalletValidation.LIMITS.DAILY_DEPOSIT_LIMIT) - todaysDepositTotal;
        
        updateState({
          remainingDepositLimit: Math.max(0, remainingLimit),
          transactionHistory: transactionArray,
        });
      } catch (historyError) {
        console.error('[BuyerWallet] Error getting transaction history:', historyError);
        updateState({
          transactionHistory: [],
        });
      }
      
    } catch (error) {
      console.error('[BuyerWallet] Balance sync error:', error);
      updateState({
        message: 'Failed to sync wallet. Please refresh the page.',
        messageType: 'error'
      });
    }
  }, [user, getBuyerBalance, getTransactionHistory, updateState]);

  // Initial sync when wallet is initialized and user is available
  useEffect(() => {
    if (walletInitialized && user?.username && !initialSyncDone.current) {
      console.log('[BuyerWallet] Performing initial sync');
      initialSyncDone.current = true;
      syncBalance();
    }
  }, [walletInitialized, user?.username, syncBalance]);

  // Listen for changes in buyer balances from WalletContext
  useEffect(() => {
    if (user?.username && buyerBalances && buyerBalances[user.username] !== undefined) {
      const newBalance = buyerBalances[user.username];
      if (Math.abs(newBalance - state.balance) > 0.01) {
        console.log('[BuyerWallet] Balance change detected:', newBalance);
        updateState({
          balance: newBalance,
          availableBalance: newBalance,
        });
      }
    }
  }, [buyerBalances, user?.username, state.balance, updateState]);

  // Periodic sync (every 15 seconds)
  useEffect(() => {
    if (user?.username) {
      syncIntervalRef.current = setInterval(() => {
        syncBalance();
      }, 15000);
      
      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [user?.username, syncBalance]);

  // Handle add funds
  const handleAddFunds = useCallback(async () => {
    // Check rate limit first
    const rateLimitResult = checkDepositLimit();
    if (!rateLimitResult.allowed) {
      updateState({
        rateLimitError: `Too many deposit attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
        message: '',
        messageType: ''
      });
      return;
    }
    
    updateState({ 
      isLoading: true, 
      validationErrors: [],
      rateLimitError: null 
    });
    
    if (!user?.username) {
      updateState({ 
        message: 'You must be logged in to add funds.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    // Validate amount using security service
    const validationResult = securityService.validateAmount(state.amountToAdd, {
      min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
      max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
      allowDecimals: true
    });

    if (!validationResult.valid || !validationResult.value) {
      updateState({ 
        message: validationResult.error || 'Invalid amount',
        messageType: 'error',
        isLoading: false,
        validationErrors: [validationResult.error || 'Invalid amount']
      });
      return;
    }

    const amount = validationResult.value;
    const amountInCents = Money.fromDollars(amount);

    // Check daily limit
    if (amount > state.remainingDepositLimit) {
      updateState({ 
        message: `Daily deposit limit exceeded. You can add up to $${state.remainingDepositLimit.toFixed(2)} today.`,
        messageType: 'error',
        isLoading: false,
        validationErrors: ['Daily limit exceeded']
      });
      return;
    }

    try {
      // Check for suspicious activity before processing
      const activityCheck = await checkSuspiciousActivity(user.username!);
      if (activityCheck.suspicious) {
        toast.warning(
          'Security Alert', 
          'Unusual activity detected. Please contact support if you need assistance.'
        );
      }

      // Use WalletContext addDeposit (server-side)
      console.log('[BuyerWallet] Processing deposit via WalletContext addDeposit...');
      
      const depositSuccess = await addDeposit(
        user.username!,
        amount,
        'credit_card',
        sanitizeStrict('Wallet deposit via buyer dashboard')
      );
      
      if (depositSuccess) {
        // Wait a moment for the deposit to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force sync balance from server
        await syncBalance();
        
        updateState({
          amountToAdd: '',
          message: `Successfully added ${Money.format(amountInCents)} to your wallet.`,
          messageType: 'success',
          isLoading: false
        });
        
        toast.success('Funds Added', `${Money.format(amountInCents)} has been added to your wallet`);
      } else {
        updateState({ 
          message: 'Failed to process deposit. Please try again.',
          messageType: 'error',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Add funds error:', error);
      updateState({ 
        message: 'An unexpected error occurred. Please try again.',
        messageType: 'error',
        isLoading: false
      });
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      updateState({ 
        message: '', 
        messageType: '', 
        validationErrors: [],
        rateLimitError: null 
      });
    }, 5000);
  }, [state.amountToAdd, state.remainingDepositLimit, user, checkSuspiciousActivity, addDeposit, syncBalance, toast, updateState, checkDepositLimit]);

  // Validate amount as user types
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      updateState({ amountToAdd: value });
      
      // Real-time validation
      if (value) {
        const validation = securityService.validateAmount(value, {
          min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
          max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
          allowDecimals: true
        });
        
        if (!validation.valid) {
          updateState({ validationErrors: [validation.error || 'Invalid amount'] });
        } else if (validation.value && validation.value > state.remainingDepositLimit) {
          updateState({ 
            validationErrors: [`Daily limit: $${state.remainingDepositLimit.toFixed(2)} remaining`] 
          });
        } else {
          updateState({ validationErrors: [] });
        }
      } else {
        updateState({ validationErrors: [] });
      }
    }
  }, [state.remainingDepositLimit, updateState]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.amountToAdd && !state.isLoading && state.validationErrors.length === 0) {
      handleAddFunds();
    }
  }, [state.amountToAdd, state.isLoading, state.validationErrors, handleAddFunds]);

  const handleQuickAmountSelect = useCallback((amount: string) => {
    // Validate the quick amount
    const validation = securityService.validateAmount(amount, {
      min: Money.toDollars(WalletValidation.LIMITS.MIN_DEPOSIT),
      max: Money.toDollars(WalletValidation.LIMITS.MAX_DEPOSIT),
      allowDecimals: true
    });

    if (!validation.valid || !validation.value) {
      toast.error('Invalid Amount', validation.error || 'Invalid amount selected');
      return;
    }

    const numAmount = validation.value;
    
    // Check if amount exceeds daily limit
    if (numAmount > state.remainingDepositLimit) {
      toast.warning(
        'Limit Exceeded', 
        `This amount exceeds your daily limit. Maximum: $${state.remainingDepositLimit.toFixed(2)}`
      );
      updateState({ 
        amountToAdd: state.remainingDepositLimit.toFixed(2),
        validationErrors: []
      });
    } else {
      updateState({ amountToAdd: amount, validationErrors: [] });
    }
  }, [state.remainingDepositLimit, toast, updateState]);

  // Load transaction history
  const loadTransactionHistory = useCallback(async () => {
    if (!user?.username) return;
    
    updateState({ isLoadingHistory: true });
    try {
      const history = await getTransactionHistory(user.username, 50);
      const transactionArray = Array.isArray(history) ? history : [];
      updateState({ 
        transactionHistory: transactionArray,
        isLoadingHistory: false 
      });
    } catch (error) {
      console.error('Error loading transaction history:', error);
      updateState({ 
        isLoadingHistory: false,
        message: 'Failed to load transaction history',
        messageType: 'error',
        transactionHistory: []
      });
    }
  }, [user, getTransactionHistory, updateState]);

  // Check for suspicious activity periodically
  useEffect(() => {
    const checkActivity = async () => {
      if (!user?.username) return;
      
      const now = new Date();
      const timeSinceLastCheck = now.getTime() - lastActivityCheckRef.current.getTime();
      
      // Check every 5 minutes
      if (timeSinceLastCheck > 5 * 60 * 1000) {
        try {
          const activityCheck = await checkSuspiciousActivity(user.username);
          if (activityCheck.suspicious) {
            toast.warning(
              'Security Notice',
              'Unusual activity detected on your account. Please review your recent transactions.'
            );
          }
          lastActivityCheckRef.current = now;
        } catch (error) {
          console.error('Activity check error:', error);
        }
      }
    };

    const interval = setInterval(checkActivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, checkSuspiciousActivity, toast]);

  // Format currency for display
  const formatCurrency = useCallback((amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  return {
    // State
    ...state,
    
    // Computed values
    buyerPurchases,
    recentPurchases,
    totalSpent,
    user,
    
    // Formatted values
    formattedBalance: formatCurrency(state.balance),
    formattedAvailableBalance: formatCurrency(state.availableBalance),
    formattedPendingBalance: formatCurrency(state.pendingBalance),
    formattedTotalSpent: formatCurrency(totalSpent),
    formattedDailyLimit: formatCurrency(state.dailyDepositLimit),
    formattedRemainingLimit: formatCurrency(state.remainingDepositLimit),
    
    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    loadTransactionHistory,
    syncBalance,
    
    // Utilities
    formatCurrency,
  };
};
