// src/utils/messageUtils.ts

export interface Message {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image';
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
