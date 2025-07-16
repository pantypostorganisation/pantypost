// src/hooks/profile/useSellerSubscription.ts

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

export function useSellerSubscription(username: string, subscriptionPrice: number | null) {
  const { user } = useAuth();
  const { isSubscribed, subscribeToSeller, unsubscribeFromSeller } = useListings();

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Computed values
  const hasAccess = user?.username ? isSubscribed(user.username, sanitizedUsername) : undefined;

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
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert('Subscription failed. Insufficient balance or another error occurred.');
      setShowSubscribeModal(false);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!user?.username || user.role !== 'buyer') return;
    
    await unsubscribeFromSeller(user.username, sanitizedUsername);
    setShowUnsubscribeModal(false);
  };

  return {
    // Access
    hasAccess,
    isValidPrice,
    
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
