// src/hooks/profile/useSellerTips.ts

import { useState, useContext, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WalletContext } from '@/context/WalletContext';
import { tipService } from '@/services/tip.service';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export function useSellerTips(username: string) {
  const { user } = useAuth();
  const walletContext = useContext(WalletContext);

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Modal state
  const [showTipModal, setShowTipModal] = useState(false);
  
  // Form state
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Rate limiter
  const rateLimiter = getRateLimiter();

  // Get user balance from wallet context
  const userBalance = user && walletContext 
    ? walletContext.getBuyerBalance(user.username) 
    : 0;

  // Handlers
  const handleTipAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setTipAmount(cleaned);
    setTipError(''); // Clear error when user types
  };

  const handleTipSubmit = useCallback(async () => {
    setTipError('');
    setTipSuccess(false);
    
    if (!user?.username || user.role !== 'buyer') {
      setTipError('You must be logged in as a buyer to tip.');
      return;
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.check('TIP', {
      ...RATE_LIMITS.TIP,
      identifier: user.username
    });

    if (!rateLimitResult.allowed) {
      setTipError(`Too many tip attempts. Please wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }

    // Validate tip amount using security service
    const validationResult = securityService.validateAmount(tipAmount, {
      min: 1,
      max: 500,
    });

    if (!validationResult.valid || !validationResult.value) {
      setTipError(validationResult.error || 'Invalid tip amount.');
      return;
    }

    // Validate against tip schema
    try {
      messageSchemas.tipAmount.parse(validationResult.value);
    } catch (error) {
      setTipError('Tip amount must be between $1 and $500.');
      return;
    }

    // Check balance
    if (validationResult.value > userBalance) {
      setTipError('Insufficient wallet balance.');
      return;
    }

    setIsProcessing(true);

    try {
      // Send tip via service
      const result = await tipService.sendTip(sanitizedUsername, validationResult.value);
      
      if (result.success) {
        setTipSuccess(true);
        setTipAmount('');
        
        // Reload wallet data to reflect new balance
        if (walletContext && walletContext.reloadData) {
          await walletContext.reloadData();
        }
        
        // Auto-close modal after success
        setTimeout(() => {
          setShowTipModal(false);
          setTipSuccess(false);
        }, 1500);
      } else {
        setTipError(result.message || 'Failed to send tip.');
      }
    } catch (error) {
      console.error('Error sending tip:', error);
      setTipError('Failed to send tip. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [user, tipAmount, userBalance, sanitizedUsername, walletContext, rateLimiter]);

  // Reset form when modal opens/closes
  const handleModalToggle = (show: boolean) => {
    setShowTipModal(show);
    if (!show) {
      setTipAmount('');
      setTipError('');
      setTipSuccess(false);
      setIsProcessing(false);
    }
  };

  return {
    // Modal state
    showTipModal,
    setShowTipModal: handleModalToggle,
    
    // Form state
    tipAmount,
    setTipAmount: handleTipAmountChange,
    tipSuccess,
    tipError,
    isProcessing,
    
    // User balance
    userBalance,
    
    // Handlers
    handleTipSubmit,
  };
}
