// src/hooks/useMessageData.ts
'use client';

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Conversation, Message, MessageStats, UserProfile } from '@/types/seller-message';

// Helper function to get tier info
const getTierInfo = (salesCount: number) => {
  const tiers = [
    { min: 0, max: 9, name: 'Flirt', displayName: 'Flirt' },
    { min: 10, max: 24, name: 'Tease', displayName: 'Tease' },
    { min: 25, max: 49, name: 'Desire', displayName: 'Desire' },
    { min: 50, max: 99, name: 'Obsession', displayName: 'Obsession' },
    { min: 100, max: Infinity, name: 'Goddess', displayName: 'Goddess' }
  ];
  
  const currentTier = tiers.find(t => salesCount >= t.min && salesCount <= t.max) || tiers[0];
  const nextTier = tiers.find(t => t.min > salesCount);
  
  return {
    currentTier: currentTier.name,
    displayName: currentTier.displayName,
    nextTier: nextTier?.name,
    currentSales: salesCount,
    salesNeeded: nextTier ? nextTier.min - salesCount : 0
  };
};

export const useMessageData = (sellerUsername: string, messages: { [key: string]: Message[] }) => {
  const { user } = useAuth();
  
  // Get all users from localStorage (temporary solution)
  const getUserByUsername = useCallback((username: string) => {
    try {
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        return users.find((u: any) => u.username === username);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
    return null;
  }, []);
  
  const conversations = useMemo(() => {
    if (!sellerUsername || !messages[sellerUsername]) return [];
    
    const sellerMessages = messages[sellerUsername] || [];
    const conversationMap = new Map<string, Conversation>();
    
    sellerMessages.forEach(msg => {
      const otherUser = msg.sender === sellerUsername ? msg.receiver : msg.sender;
      
      if (!conversationMap.has(otherUser)) {
        conversationMap.set(otherUser, {
          buyer: otherUser,
          lastMessage: msg,
          messages: [msg],
          unreadCount: 0
        });
      } else {
        const conv = conversationMap.get(otherUser)!;
        conv.messages.push(msg);
        
        // Update last message if this one is newer
        if (new Date(msg.date) > new Date(conv.lastMessage.date)) {
          conv.lastMessage = msg;
        }
      }
      
      // Count unread messages
      if (!msg.read && msg.receiver === sellerUsername) {
        const conv = conversationMap.get(otherUser)!;
        conv.unreadCount++;
      }
    });
    
    // Sort by last message date
    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.date).getTime() - new Date(a.lastMessage.date).getTime()
    );
  }, [sellerUsername, messages]);
  
  const userProfiles = useMemo(() => {
    const profiles: { [key: string]: UserProfile } = {};
    
    conversations.forEach(conv => {
      const user = getUserByUsername(conv.buyer);
      if (user) {
        profiles[conv.buyer] = {
          pic: user.pic || null,
          verified: user.isVerified || false,
          role: user.role,
          tierInfo: user.role === 'seller' ? getTierInfo(user.salesCount || 0) : undefined
        };
      }
    });
    
    return profiles;
  }, [conversations, getUserByUsername]);
  
  const stats = useMemo(() => {
    const stats: MessageStats = {
      totalThreads: conversations.length,
      totalUnreadMessages: 0,
      totalUnreadThreads: 0,
      customRequests: 0
    };
    
    conversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        stats.totalUnreadMessages += conv.unreadCount;
        stats.totalUnreadThreads++;
      }
      
      // Count custom requests
      conv.messages.forEach(msg => {
        if (msg.type === 'customRequest' && msg.receiver === sellerUsername && !msg.read) {
          stats.customRequests++;
        }
      });
    });
    
    return stats;
  }, [conversations, sellerUsername]);
  
  return { conversations, userProfiles, stats };
};