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

  // Balance
  const userBalance =
    user && walletContext ? walletContext.getBuyerBalance(user.username) : 0;

  // Handlers
  const handleTipAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setTipAmount(cleaned);
    setTipError('');
  };

  const handleTipSubmit = useCallback(async () => {
    setTipError('');
    setTipSuccess(false);

    if (!user?.username || user.role !== 'buyer') {
      setTipError('You must be logged in as a buyer to tip.');
      return;
    }

    const rateCheck = rateLimiter.check('TIP', {
      ...RATE_LIMITS.TIP,
      identifier: user.username,
    });
    if (!rateCheck.allowed) {
      setTipError(
        `Too many tip attempts. Please wait ${rateCheck.waitTime} seconds.`
      );
      return;
    }

    const validation = securityService.validateAmount(tipAmount, {
      min: 1,
      max: 500,
    });
    if (!validation.valid || !validation.value) {
      setTipError(validation.error || 'Invalid tip amount.');
      return;
    }

    try {
      messageSchemas.tipAmount.parse(validation.value);
    } catch {
      setTipError('Tip amount must be between $1 and $500.');
      return;
    }

    if (validation.value > userBalance) {
      setTipError('Insufficient wallet balance.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await tipService.sendTip(
        sanitizedUsername,
        validation.value
      );

      if (result.success) {
        setTipSuccess(true);
        setTipAmount('');

        if (walletContext?.reloadData) {
          await walletContext.reloadData();
        }

        setTimeout(() => {
          setShowTipModal(false);
          setTipSuccess(false);
        }, 1500);
      } else {
        setTipError(result.message || 'Failed to send tip.');
      }
    } catch (e) {
      console.error('Error sending tip:', e);
      setTipError('Failed to send tip. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    user,
    tipAmount,
    userBalance,
    sanitizedUsername,
    walletContext,
    rateLimiter,
  ]);

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
