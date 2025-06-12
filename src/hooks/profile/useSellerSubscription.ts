// src/hooks/profile/useSellerSubscription.ts
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';

export function useSellerSubscription(username: string, subscriptionPrice: number | null) {
  const { user } = useAuth();
  const { isSubscribed, subscribeToSeller, unsubscribeFromSeller } = useListings();

  // Modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Computed values
  const hasAccess = user?.username ? isSubscribed(user.username, username) : undefined;

  // Handlers
  const handleConfirmSubscribe = () => {
    if (!user?.username || user.role !== 'buyer' || subscriptionPrice === null) {
      alert('Cannot subscribe. Please check your login status and seller subscription price.');
      return;
    }
    const success = subscribeToSeller(user.username, username, subscriptionPrice);
    if (success) {
      setShowSubscribeModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert('Subscription failed. Insufficient balance or another error occurred.');
      setShowSubscribeModal(false);
    }
  };

  const handleConfirmUnsubscribe = () => {
    if (!user?.username || user.role !== 'buyer') return;
    unsubscribeFromSeller(user.username, username);
    setShowUnsubscribeModal(false);
  };

  return {
    // Access
    hasAccess,
    
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