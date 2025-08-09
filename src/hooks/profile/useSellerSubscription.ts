// src/hooks/profile/useSellerSubscription.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

const API_BASE_URL = 'http://localhost:5000/api';

export function useSellerSubscription(username: string, subscriptionPrice: number | null) {
  const { user, getAuthToken } = useAuth();
  const { subscribeToSeller, unsubscribeFromSeller } = useListings();

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);
  
  console.log('[useSellerSubscription] Hook initialized:', {
    username,
    sanitizedUsername,
    user: user?.username,
    role: user?.role,
    subscriptionPrice
  });

  // Modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Subscription state
  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Make checkSubscriptionStatus a useCallback so it can be called from multiple places
  const checkSubscriptionStatus = useCallback(async () => {
    console.log('[useSellerSubscription] Checking subscription status for:', {
      buyer: user?.username,
      seller: sanitizedUsername,
      role: user?.role
    });
    
    if (!user?.username || user.role !== 'buyer' || !sanitizedUsername) {
      console.log('[useSellerSubscription] No access - missing user/role/username');
      setHasAccess(false);
      setCheckingAccess(false);
      return;
    }

    // Don't check if user is viewing their own profile
    if (user.username === sanitizedUsername) {
      console.log('[useSellerSubscription] Own profile - granting access');
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    // Reset checking state
    setCheckingAccess(true);

    try {
      // Get token using the auth context method if available, or from localStorage
      let token = null;
      
      // Try to get token from AuthContext if it has a getAuthToken method
      if (typeof getAuthToken === 'function') {
        token = await getAuthToken();
        console.log('[useSellerSubscription] Got token from AuthContext');
      }
      
      // Fallback to localStorage
      if (!token) {
        token = localStorage.getItem('authToken');
        console.log('[useSellerSubscription] Got token from localStorage:', !!token);
      }
      
      if (!token) {
        console.log('[useSellerSubscription] No token available - will retry');
        // Don't set hasAccess to false yet, just keep checking state true
        return;
      }

      console.log('[useSellerSubscription] Checking subscription via API...');
      
      // Check subscription status via API using POST endpoint
      const response = await fetch(`${API_BASE_URL}/subscriptions/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriber: user.username,
          creator: sanitizedUsername
        })
      });

      console.log('[useSellerSubscription] Check response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[useSellerSubscription] Check response:', data);
        
        // Check the isSubscribed field from the response
        const isSubscribed = data.isSubscribed === true || (data.data && data.data.status === 'active');
        console.log('[useSellerSubscription] Is subscribed?', isSubscribed);
        setHasAccess(isSubscribed);
        setCheckingAccess(false);
      } else {
        console.log('[useSellerSubscription] Check endpoint failed, no subscription');
        setHasAccess(false);
        setCheckingAccess(false);
      }
    } catch (error) {
      console.error('[useSellerSubscription] Error checking subscription status:', error);
      setHasAccess(false);
      setCheckingAccess(false);
    }
  }, [user?.username, user?.role, sanitizedUsername, getAuthToken]);

  // Check subscription status when component mounts or when key dependencies change
  useEffect(() => {
    console.log('[useSellerSubscription] useEffect triggered - user state:', {
      hasUser: !!user,
      username: user?.username,
      role: user?.role
    });
    
    // Only check if we have a user and they're a buyer
    if (user && user.role === 'buyer' && sanitizedUsername) {
      checkSubscriptionStatus();
    } else if (!user) {
      // If no user yet, we're still loading
      console.log('[useSellerSubscription] No user yet, will check when user is available');
    } else if (user && user.role !== 'buyer') {
      // User exists but not a buyer
      setHasAccess(false);
      setCheckingAccess(false);
    }
  }, [user, user?.username, user?.role, sanitizedUsername, checkSubscriptionStatus]);

  // Set up a retry mechanism for when token becomes available
  useEffect(() => {
    if (!user || user.role !== 'buyer' || hasAccess !== undefined) {
      return;
    }

    console.log('[useSellerSubscription] Setting up token check interval');
    
    const checkInterval = setInterval(async () => {
      const token = localStorage.getItem('authToken') || (typeof getAuthToken === 'function' ? await getAuthToken() : null);
      
      if (token) {
        console.log('[useSellerSubscription] Token now available, checking subscription');
        clearInterval(checkInterval);
        checkSubscriptionStatus();
      }
    }, 500); // Check every 500ms

    // Clean up after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (hasAccess === undefined) {
        console.log('[useSellerSubscription] Token check timeout, assuming no access');
        setHasAccess(false);
        setCheckingAccess(false);
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [user, user?.role, hasAccess, checkSubscriptionStatus, getAuthToken]);

  // Also check subscription status when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.username && user.role === 'buyer') {
        console.log('[useSellerSubscription] Page became visible, rechecking subscription status');
        checkSubscriptionStatus();
      }
    };

    const handleFocus = () => {
      if (user?.username && user.role === 'buyer') {
        console.log('[useSellerSubscription] Window focused, rechecking subscription status');
        checkSubscriptionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSubscriptionStatus, user?.username, user?.role]);

  // Validate subscription price
  const isValidPrice = subscriptionPrice !== null && 
    subscriptionPrice > 0 && 
    subscriptionPrice <= 1000;

  // Handlers
  const handleConfirmSubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') {
      alert('You must be logged in as a buyer to subscribe.');
      return;
    }

    if (subscriptionPrice === null || !isValidPrice) {
      alert('Invalid subscription price. Please contact support.');
      return;
    }

    // Validate price again before processing
    const validatedPrice = securityService.validateAmount(subscriptionPrice, {
      min: 1,
      max: 1000,
    });

    if (!validatedPrice.valid || !validatedPrice.value) {
      alert('Invalid subscription price. Please contact support.');
      return;
    }

    const success = await subscribeToSeller(
      user.username, 
      sanitizedUsername, 
      validatedPrice.value
    );

    if (success) {
      setShowSubscribeModal(false);
      setShowToast(true);
      // Update hasAccess immediately after successful subscription
      setHasAccess(true);
      
      setTimeout(() => setShowToast(false), 3000);
    } else {
      // Check if already subscribed by re-checking status
      await checkSubscriptionStatus();
      setShowSubscribeModal(false);
      
      if (!hasAccess) {
        alert('Subscription failed. Please check your balance and try again.');
      }
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') return;
    
    try {
      await unsubscribeFromSeller(user.username, sanitizedUsername);
      
      // Update state after successful unsubscribe
      setShowUnsubscribeModal(false);
      setHasAccess(false);
      
      console.log('[useSellerSubscription] Successfully unsubscribed');
    } catch (error) {
      console.error('[useSellerSubscription] Error unsubscribing:', error);
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
