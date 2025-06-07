// src/types/message.ts

export type MessageType = 'normal' | 'customRequest' | 'image';

export interface Message {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: MessageType;
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
}

export interface MessageThread {
  username: string;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export interface UserProfile {
  pic: string | null;
  verified: boolean;
  role: string;
}

export interface MessageStats {
  totalThreads: number;
  totalUnreadMessages: number;
  totalUnreadThreads: number;
  buyerThreads: number;
  sellerThreads: number;
}