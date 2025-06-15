// src/utils/messageUtils.ts

import { safeStorage } from '@/utils/safeStorage';

export interface Message {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  isRead?: boolean;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image';
  imageUrl?: string;
  isTip?: boolean;
  tipAmount?: number;
  isCustomRequest?: boolean;
  requestData?: any;
  messageKey?: string;
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
}

export interface CustomRequest {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'edited' | 'paid';
  date: string;
  messageThreadId?: string; // Optional to match RequestContext
  lastModifiedBy?: string; // Optional to match RequestContext
  originalMessageId?: string; // Make optional to match RequestContext
  paid?: boolean;
}

// Process messages to handle custom requests correctly
export function getLatestCustomRequestMessages(messages: Message[], requests: CustomRequest[]): Message[] {
  const seen = new Set<string>();
  const result: Message[] = [];
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
      if (!seen.has(msg.meta.id)) {
        seen.add(msg.meta.id);
        result.unshift(msg);
      }
    } else {
      result.unshift(msg);
    }
  }
  
  return result;
}

// Get the initial for avatar placeholder
export function getInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

// Helper function to check if content is a single emoji
export function isSingleEmoji(content: string): boolean {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
  return emojiRegex.test(content);
}

// Format time function
export function formatTimeAgo(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) {
    return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
  }
  
  return 'Just now';
}

// Additional utility functions for messages
export function saveRecentEmojis(emojis: string[]): void {
  safeStorage.setItem('recentEmojis', emojis);
}

export function getRecentEmojis(): string[] {
  return safeStorage.getItem<string[]>('recentEmojis', []) || [];
}

export function validateImageSize(file: File): string | null {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return 'Image must be less than 5MB';
  }
  return null;
}

export function checkImageExists(base64String: string): boolean {
  return !!base64String && base64String.startsWith('data:image/');
}

export function getMessageKey(sender: string, receiver: string): string {
  return [sender, receiver].sort().join('-');
}

export function formatMessage(content: string): string {
  // Simple formatting for now
  return content.trim();
}

// Helper to get conversation key (for MessageContext compatibility)
export function getConversationKey(sender: string, receiver: string): string {
  return getMessageKey(sender, receiver);
}

// Format message timestamp
export function formatMessageTime(date: string): string {
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today - show time only
    return messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return messageDate.toLocaleDateString([], { 
      weekday: 'short' 
    });
  } else {
    // Older - show date
    return messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Get user initials for avatar
export function getUserInitials(username: string): string {
  if (!username) return '?';
  
  const words = username.split(/[\s_-]+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  return username.substring(0, 2).toUpperCase();
}

// Truncate message for preview
export function truncateMessage(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}