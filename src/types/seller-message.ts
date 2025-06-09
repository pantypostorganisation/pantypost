// src/types/seller-message.ts

export type MessageType = 'normal' | 'customRequest' | 'image';

export interface MessageMeta {
  id?: string;
  title?: string;
  price?: number;
  tags?: string[];
  message?: string;
  imageUrl?: string;
}

export interface Message {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: MessageType;
  meta?: MessageMeta;
}

export interface Conversation {
  buyer: string;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

export interface UserProfile {
  pic: string | null;
  verified: boolean;
  role: string;
  tierInfo?: {
    currentTier: string;
    displayName: string;
    nextTier?: string;
    currentSales?: number;
    salesNeeded?: number;
  };
}

export interface MessageStats {
  totalThreads: number;
  totalUnreadMessages: number;
  totalUnreadThreads: number;
  customRequests: number;
}
