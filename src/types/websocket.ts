// src/types/websocket.ts

// WebSocket event types for real-time communication
export enum WebSocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  RECONNECT = 'reconnect',
  
  // Message events
  MESSAGE_NEW = 'message:new',
  MESSAGE_UPDATE = 'message:update',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_READ = 'message:read',
  
  // Order events
  ORDER_NEW = 'order:new',
  ORDER_UPDATE = 'order:update',
  ORDER_STATUS_CHANGE = 'order:status_change',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  
  // User events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_UPDATED = 'user:updated',
  
  // Wallet events
  WALLET_BALANCE_UPDATE = 'wallet:balance_update',
  WALLET_TRANSACTION = 'wallet:transaction',
  
  // Listing events
  LISTING_NEW = 'listing:new',
  LISTING_UPDATE = 'listing:update',
  LISTING_SOLD = 'listing:sold',
  
  // Subscription events
  SUBSCRIPTION_NEW = 'subscription:new',
  SUBSCRIPTION_CANCELLED = 'subscription:cancelled',
  
  // Auction events (ADDED)
  AUCTION_BID = 'auction:bid',
  AUCTION_OUTBID = 'auction:outbid',
  AUCTION_ENDING = 'auction:ending',
  AUCTION_ENDED = 'auction:ended'
}

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket message structure
export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  data: T;
  timestamp: number;
  id?: string;
}

// WebSocket connection options
export interface WebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  auth?: {
    token?: string;
  };
}

// WebSocket subscription handler
export type WebSocketHandler<T = any> = (data: T) => void;

// WebSocket error
export interface WebSocketError {
  message: string;
  code?: string;
  details?: any;
}

// Typing indicator data
export interface TypingData {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

// Online status data
export interface OnlineStatusData {
  userId: string;
  username: string;  // Added this field
  isOnline: boolean;
  timestamp: string; // Added for backend compatibility
  lastSeen?: Date;
}

// Real-time notification
export interface RealtimeNotification {
  id: string;
  type: 'message' | 'order' | 'wallet' | 'subscription' | 'system' | 'auction'; // Added 'auction'
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date | string; // Allow string for JSON dates
}
