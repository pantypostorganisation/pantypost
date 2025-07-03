// src/types/message.ts

export type MessageType = 'normal' | 'customRequest' | 'image' | 'tip';

export interface Message {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  isRead?: boolean;
  type?: MessageType;
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
    tipAmount?: number;
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface MessageThread {
  id: string;
  username: string;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  participants: [string, string];
  updatedAt: string;
  blockedBy?: string[];
  metadata?: {
    [key: string]: any;
  };
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

export interface MessageNotification {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
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
  messageThreadId?: string;
  lastModifiedBy?: string;
  originalMessageId?: string;
  paid?: boolean;
}

export interface ReportLog {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean;
  banApplied?: boolean;
  banId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
}
