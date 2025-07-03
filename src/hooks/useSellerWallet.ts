// src/hooks/useSellerWallet.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

export function useSellerWallet() {
  const { user } = useAuth();
  const { 
    getSellerBalance, 
    addSellerWithdrawal, 
    sellerWithdrawals, 
    orderHistory 
  } = useWallet();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const logs = user ? sellerWithdrawals[user.username] || [] : [];
  
  // Sort withdrawals by date (newest first)
  const sortedWithdrawals = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Get recent withdrawals (last 5)
  const recentWithdrawals = sortedWithdrawals.slice(0, 5);
  
  // Calculate total withdrawn
  const totalWithdrawn = logs.reduce((sum, log) => sum + log.amount, 0);
  
  // Get seller's sales history
  const sellerSales = user?.username 
    ? orderHistory.filter(order => order.seller === user.username)
    : [];
  
  // Calculate total earnings (including current balance)
  const totalEarnings = balance + totalWithdrawn;

  useEffect(() => {
    if (user?.username) {
      const raw = getSellerBalance(user.username);
      setBalance(parseFloat(raw.toFixed(2)));
    }
  }, [user, getSellerBalance, logs]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWithdrawAmount(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleWithdrawClick();
    }
  };

  const handleQuickAmountSelect = (amount: string) => {
    setWithdrawAmount(amount);
  };

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount.');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }

    const rounded = parseFloat(amount.toFixed(2));
    if (rounded > balance) {
      setMessage('Withdrawal exceeds available balance.');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmWithdraw = () => {
    setIsLoading(true);
    const amount = parseFloat(withdrawAmount);
    const rounded = parseFloat(amount.toFixed(2));
    
    try {
      if (user && user.username) {
        // Simulate a slight delay for better UX
        setTimeout(() => {
          addSellerWithdrawal(user.username!, rounded);
          setMessage(`Successfully withdrew $${rounded.toFixed(2)}.`);
          setMessageType('success');
          setWithdrawAmount('');
          setShowConfirmation(false);
          setIsLoading(false);
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            setMessage('');
            setMessageType('');
          }, 5000);
        }, 800);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setMessageType('error');
      setIsLoading(false);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  return {
    // State
    balance,
    withdrawAmount,
    message,
    messageType,
    isLoading,
    showConfirmation,
    
    // Computed values
    sortedWithdrawals,
    totalWithdrawn,
    totalEarnings,
    recentWithdrawals,
    sellerSales,
    
    // Actions
    handleWithdrawClick,
    handleConfirmWithdraw,
    handleAmountChange,
    handleKeyPress,
    handleQuickAmountSelect,
    setShowConfirmation,
    setWithdrawAmount
  };
}