// src/hooks/profile/useSellerTips.ts
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';

export function useSellerTips(username: string) {
  const { user } = useAuth();
  const { sendTip } = useWallet();

  // Modal state
  const [showTipModal, setShowTipModal] = useState(false);
  
  // Form state
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');

  // Handlers
  const handleTipSubmit = () => {
    setTipError('');
    setTipSuccess(false);
    
    if (!user?.username || user.role !== 'buyer') {
      setTipError('You must be logged in as a buyer to tip.');
      return;
    }
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Enter a valid tip amount.');
      return;
    }
    
    const success = sendTip(user.username, username, amount);
    if (!success) {
      setTipError('Insufficient wallet balance.');
      return;
    }
    
    setTipSuccess(true);
    setTipAmount('');
    setTimeout(() => {
      setShowTipModal(false);
      setTipSuccess(false);
    }, 1500);
  };

  return {
    // Modal state
    showTipModal,
    setShowTipModal,
    
    // Form state
    tipAmount,
    setTipAmount,
    tipSuccess,
    tipError,
    
    // Handlers
    handleTipSubmit,
  };
}
