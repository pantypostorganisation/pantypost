// src/hooks/profile/useSellerTips.ts

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export function useSellerTips(username: string) {
  const { user } = useAuth();
  const { sendTip } = useWallet();

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Modal state
  const [showTipModal, setShowTipModal] = useState(false);
  
  // Form state
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');

  // Rate limiter
  const rateLimiter = getRateLimiter();

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

  const handleTipSubmit = () => {
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

    const success = sendTip(user.username, sanitizedUsername, validationResult.value);
    
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

  // Reset form when modal opens/closes
  const handleModalToggle = (show: boolean) => {
    setShowTipModal(show);
    if (!show) {
      setTipAmount('');
      setTipError('');
      setTipSuccess(false);
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
    
    // Handlers
    handleTipSubmit,
  };
}
