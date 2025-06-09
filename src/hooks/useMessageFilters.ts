// src/hooks/useMessageFilters.ts
'use client';

import { useState, useMemo } from 'react';
import { Conversation } from '@/types/seller-message';

export type FilterType = 'all' | 'unread' | 'custom';

export const useMessageFilters = (conversations: Conversation[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.buyer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'custom':
        filtered = filtered.filter(conv => 
          conv.messages.some(msg => msg.type === 'customRequest')
        );
        break;
    }
    
    return filtered;
  }, [conversations, searchTerm, filterType]);
  
  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    filteredConversations
  };
};