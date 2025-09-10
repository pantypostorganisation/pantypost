// src/hooks/profile/useSellerSubscription.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

const API_BASE_URL = 'http://localhost:5000/api';

export function useSellerSubscription(
  username: string,
  subscriptionPrice: number | null
) {
  const { user, getAuthToken } = useAuth();
  const { subscribeToSeller, unsubscribeFromSeller } = useListings();

  const sanitizedUsername = sanitizeUsername(username);

  // Modals & toasts
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Access state
  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user?.username || user.role !== 'buyer' || !sanitizedUsername) {
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    if (user.username === sanitizedUsername) {
      // own profile
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    setCheckingAccess(true);

    try {
      let token: string | null = null;
      if (typeof getAuthToken === 'function') {
        token = await getAuthToken();
      }
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }
      if (!token) {
        // wait for token (effect below can retry)
        return;
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subscriber: user.username,
          creator: sanitizedUsername,
        }),
      });

      if (!response.ok) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      const data = await response.json();
      const isSubscribed =
        data?.isSubscribed === true ||
        (data?.data && data.data.status === 'active');
      setHasAccess(!!isSubscribed);
      setCheckingAccess(false);
    } catch (e) {
      console.error('[useSellerSubscription] check error:', e);
      setHasAccess(false);
      setCheckingAccess(false);
    }
  }, [user?.username, user?.role, sanitizedUsername, getAuthToken]);

  // Initial checks
  useEffect(() => {
    if (user && user.role === 'buyer' && sanitizedUsername) {
      checkSubscriptionStatus();
    } else if (user && user.role !== 'buyer') {
      setHasAccess(false);
      setCheckingAccess(false);
    }
  }, [user, user?.username, user?.role, sanitizedUsername, checkSubscriptionStatus]);

  // Retry until token arrives (max ~10s)
  useEffect(() => {
    if (!user || user.role !== 'buyer' || hasAccess !== undefined) return;

    const interval = setInterval(async () => {
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }
      if (!token && typeof getAuthToken === 'function') {
        token = await getAuthToken();
      }
      if (token) {
        clearInterval(interval);
        checkSubscriptionStatus();
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (hasAccess === undefined) {
        setHasAccess(false);
        setCheckingAccess(false);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [user, user?.role, hasAccess, checkSubscriptionStatus, getAuthToken]);

  // Recheck on visibility/focus
  useEffect(() => {
    const onVisible = () => {
      if (user?.username && user.role === 'buyer') {
        checkSubscriptionStatus();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [checkSubscriptionStatus, user?.username, user?.role]);

  // Validate price
  const isValidPrice =
    subscriptionPrice !== null &&
    subscriptionPrice > 0 &&
    subscriptionPrice <= 1000;

  // Actions
  const handleConfirmSubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') {
      alert('You must be logged in as a buyer to subscribe.');
      return;
    }

    if (subscriptionPrice === null || !isValidPrice) {
      alert('Invalid subscription price. Please contact support.');
      return;
    }

    // Double-validate price
    const { valid, value } = securityService.validateAmount(subscriptionPrice, {
      min: 1,
      max: 1000,
    });

    if (!valid || !value) {
      alert('Invalid subscription price. Please contact support.');
      return;
    }

    const success = await subscribeToSeller(user.username, sanitizedUsername, value);
    setShowSubscribeModal(false);

    if (success) {
      setHasAccess(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      await checkSubscriptionStatus();
      if (!hasAccess) {
        alert('Subscription failed. Please check your balance and try again.');
      }
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') return;

    try {
      await unsubscribeFromSeller(user.username, sanitizedUsername);
      setShowUnsubscribeModal(false);
      setHasAccess(false);
    } catch (e) {
      console.error('[useSellerSubscription] unsubscribe error:', e);
      alert('Failed to unsubscribe. Please try again.');
    }
  };

  return {
    // Access
    hasAccess,
    isValidPrice,
    checkingAccess,

    // Modals
    showSubscribeModal,
    setShowSubscribeModal,
    showUnsubscribeModal,
    setShowUnsubscribeModal,
    showToast,

    // Handlers
    handleConfirmSubscribe,
    handleConfirmUnsubscribe,
  };
}
