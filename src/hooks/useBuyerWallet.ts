// src/hooks/useBuyerWallet.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { BuyerWalletState } from '@/types/wallet';

export const useBuyerWallet = () => {
  const { user } = useAuth();
  const { 
    getBuyerBalance, 
    setBuyerBalance,
    orderHistory, 
    addDeposit 
  } = useWallet();

  const [state, setState] = useState<BuyerWalletState>({
    balance: 0,
    amountToAdd: '',
    message: '',
    messageType: '',
    isLoading: false,
    walletUpdateTrigger: 0
  });

  // Get buyer's purchase history
  const buyerPurchases = user?.username 
    ? orderHistory.filter(order => order.buyer === user.username)
    : [];
  
  // Sort purchases by date (newest first)
  const recentPurchases = [...buyerPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3); // Show only the 3 most recent purchases

  // Calculate total spent
  const totalSpent = buyerPurchases.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

  // Update state helper
  const updateState = useCallback((updates: Partial<BuyerWalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update balance whenever wallet context changes
  useEffect(() => {
    if (user?.username) {
      const rawBalance = getBuyerBalance(user.username);
      const updatedBalance = Math.max(0, rawBalance);
      updateState({ balance: updatedBalance });
    }
  }, [user, getBuyerBalance, orderHistory, state.walletUpdateTrigger, updateState]);

  // Listen for wallet updates
  useEffect(() => {
    const handleWalletUpdate = () => {
      if (user?.username) {
        const rawBalance = getBuyerBalance(user.username);
        const updatedBalance = Math.max(0, rawBalance);
        updateState({ balance: updatedBalance });
      }
    };

    window.addEventListener('walletUpdate', handleWalletUpdate);
    
    return () => {
      window.removeEventListener('walletUpdate', handleWalletUpdate);
    };
  }, [user, getBuyerBalance, updateState]);

  const handleAddFunds = useCallback(async () => {
    updateState({ isLoading: true });
    const amount = parseFloat(state.amountToAdd);
    
    if (!user?.username) {
      updateState({ 
        message: 'You must be logged in to add funds.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      updateState({ 
        message: 'Please enter a valid amount greater than $0.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    if (amount > 10000) {
      updateState({ 
        message: 'Maximum deposit amount is $10,000. Please contact support for larger deposits.',
        messageType: 'error',
        isLoading: false
      });
      return;
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    try {
      // Simulate a slight delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        // Track the deposit first
        const depositSuccess = await addDeposit(
          user.username!, 
          roundedAmount, 
          'credit_card', 
          `Wallet deposit by ${user.username}`
        );
        
        if (depositSuccess) {
          // Update local state to reflect the change immediately
          const currentBalance = getBuyerBalance(user.username!);
          const newBalance = currentBalance + roundedAmount;
          
          // Clear form and show success message
          updateState({
            balance: newBalance,
            amountToAdd: '',
            message: `Successfully added $${roundedAmount.toFixed(2)} to your wallet. Your new balance is $${newBalance.toFixed(2)}.`,
            messageType: 'success',
            walletUpdateTrigger: state.walletUpdateTrigger + 1,
            isLoading: false
          });
        } else {
          updateState({ 
            message: 'Failed to process deposit. Please try again or contact support.',
            messageType: 'error',
            isLoading: false
          });
        }
      } catch (depositError) {
        console.error('Deposit processing error:', depositError);
        updateState({ 
          message: 'An error occurred while processing your deposit. Please try again.',
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
      updateState({ message: '', messageType: '' });
    }, 5000);
  }, [state.amountToAdd, state.walletUpdateTrigger, user, addDeposit, getBuyerBalance, updateState]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      updateState({ amountToAdd: value });
    }
  }, [updateState]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && state.amountToAdd && !state.isLoading) {
      handleAddFunds();
    }
  }, [state.amountToAdd, state.isLoading, handleAddFunds]);

  const handleQuickAmountSelect = useCallback((amount: string) => {
    updateState({ amountToAdd: amount });
  }, [updateState]);

  return {
    // State
    ...state,
    
    // Computed values
    buyerPurchases,
    recentPurchases,
    totalSpent,
    user,
    
    // Actions
    handleAddFunds,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect
  };
};
