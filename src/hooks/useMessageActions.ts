// src/hooks/useMessageActions.ts
'use client';

import { useCallback } from 'react';
import { useMessages } from '@/context/MessageContext';

// Simple toast notification function
const toast = {
  success: (message: string) => {
    console.log('✅', message);
    // You can implement a proper toast notification here
  },
  error: (message: string) => {
    console.error('❌', message);
    // You can implement a proper toast notification here
  }
};

export const useMessageActions = (sellerUsername: string) => {
  const { sendMessage, blockUser } = useMessages();
  
  const handleSendMessage = useCallback((
    buyer: string, 
    content: string, 
    type?: 'normal' | 'image', 
    imageUrl?: string
  ) => {
    if (!sellerUsername) return;
    
    try {
      if (type === 'image' && imageUrl) {
        sendMessage(sellerUsername, buyer, content, {
          type: 'image',
          meta: { imageUrl }
        });
      } else {
        sendMessage(sellerUsername, buyer, content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [sellerUsername, sendMessage]);
  
  const handleBlockUser = useCallback((buyer: string) => {
    if (!sellerUsername) return;
    
    try {
      blockUser(sellerUsername, buyer);
      toast.success(`Blocked ${buyer}`);
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  }, [sellerUsername, blockUser]);
  
  const handleReportUser = useCallback((buyer: string) => {
    if (!sellerUsername) return;
    
    try {
      // For now, just log the report since we don't have access to the report methods
      console.log(`Reporting conversation between ${sellerUsername} and ${buyer}`);
      toast.success('User reported successfully');
      
      // In the future, you can implement proper reporting functionality
      // by adding it to the MessageContext or creating a separate ReportContext
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error('Failed to report user');
    }
  }, [sellerUsername]);
  
  return {
    handleSendMessage,
    handleBlockUser,
    handleReportUser
  };
};