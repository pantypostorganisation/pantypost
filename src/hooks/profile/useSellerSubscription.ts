// src/hooks/profile/useSellerSubscription.ts

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

const API_BASE_URL = 'http://localhost:5000/api';

export function useSellerSubscription(username: string, subscriptionPrice: number | null) {
  const { user } = useAuth();
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

  // Check subscription status from API
  useEffect(() => {
    console.log('[useSellerSubscription] useEffect triggered');
    
    const checkSubscriptionStatus = async () => {
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
        setHasAccess(true); // Sellers always have access to their own profile
        setCheckingAccess(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('[useSellerSubscription] No token - no access');
          setHasAccess(false);
          setCheckingAccess(false);
          return;
        }

        console.log('[useSellerSubscription] Checking subscription via API...');
        
        // Check subscription status via API
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

        if (!response.ok) {
          console.log('[useSellerSubscription] Check endpoint failed, trying active subscriptions...');
          // If endpoint doesn't exist or returns error, fallback to checking active subscriptions
          const subsResponse = await fetch(`${API_BASE_URL}/subscriptions/active`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('[useSellerSubscription] Active subs response status:', subsResponse.status);

          if (subsResponse.ok) {
            const data = await subsResponse.json();
            console.log('[useSellerSubscription] Active subscriptions:', data);
            
            if (data.success && data.data) {
              // Check if user is subscribed to this seller
              const isSubscribed = data.data.some((sub: any) => 
                sub.creator === sanitizedUsername && 
                sub.subscriber === user.username &&
                sub.status === 'active'
              );
              console.log('[useSellerSubscription] Is subscribed?', isSubscribed);
              setHasAccess(isSubscribed);
            } else {
              console.log('[useSellerSubscription] No subscription data found');
              setHasAccess(false);
            }
          } else {
            console.log('[useSellerSubscription] Failed to fetch active subscriptions');
            setHasAccess(false);
          }
        } else {
          const data = await response.json();
          console.log('[useSellerSubscription] Check response:', data);
          setHasAccess(data.isSubscribed || false);
        }
      } catch (error) {
        console.error('[useSellerSubscription] Error checking subscription status:', error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    // Run the check immediately
    checkSubscriptionStatus();
  }, []); // Empty dependency array - run once on mount

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
      
      // Also update localStorage to keep it in sync
      try {
        const storedSubs = localStorage.getItem('subscriptions');
        if (storedSubs) {
          const subs = JSON.parse(storedSubs);
          if (subs[user.username]) {
            if (!subs[user.username].includes(sanitizedUsername)) {
              subs[user.username].push(sanitizedUsername);
              localStorage.setItem('subscriptions', JSON.stringify(subs));
            }
          }
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }
      
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert('Subscription failed. Insufficient balance or another error occurred.');
      setShowSubscribeModal(false);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') return;
    
    await unsubscribeFromSeller(user.username, sanitizedUsername);
    
    // Since unsubscribeFromSeller doesn't return a success value,
    // we'll assume it succeeded and update the UI
    setShowUnsubscribeModal(false);
    // Update hasAccess immediately after unsubscription
    setHasAccess(false);
    
    // Also update localStorage to keep it in sync
    try {
      const storedSubs = localStorage.getItem('subscriptions');
      if (storedSubs) {
        const subs = JSON.parse(storedSubs);
        if (subs[user.username]) {
          subs[user.username] = subs[user.username].filter(
            (name: string) => name !== sanitizedUsername
          );
          localStorage.setItem('subscriptions', JSON.stringify(subs));
        }
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
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
