// src/types/websocket.ts

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// WebSocket event types - comprehensive list
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
  
  // Auction events
  AUCTION_BID = 'auction:bid',
  AUCTION_OUTBID = 'auction:outbid',
  AUCTION_ENDING = 'auction:ending',
  AUCTION_ENDED = 'auction:ended',
  AUCTION_CANCELLED = 'auction:cancelled',
  
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
  
  // Room events
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  
  // System events
  PING = 'ping',
  PONG = 'pong',

  // Stats events
  STATS_PAYMENTS_PROCESSED = 'stats:payments_processed'
}

// Type for WebSocket event handlers
export type WebSocketHandler<T = unknown> = (data: T) => void;

// WebSocket options
export interface WebSocketOptions {
  url: string;
  auth?: Record<string, unknown>;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

// WebSocket error
export interface WebSocketError {
  message: string;
  code?: string;
  type?: string;
}

// WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  event: WebSocketEvent;
  data: T;
  timestamp?: number;
  id?: string;
}

// Typing indicator data
export interface TypingData {
  userId: string;
  username?: string;
  conversationId?: string;
  threadId?: string; // Alternative to conversationId
  isTyping: boolean;
  timestamp?: number;
}

// Online status data
export interface OnlineStatusData {
  userId: string;
  username?: string;
  isOnline?: boolean;
  online?: boolean; // Alternative to isOnline
  lastSeen?: string;
  timestamp?: number;
}

// Realtime notification
export interface RealtimeNotification {
  id: string;
  type: 'message' | 'order' | 'wallet' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// Other event data types
export interface OrderUpdateData {
  orderId: string;
  status?: string;
  updates?: Record<string, unknown>;
  timestamp?: number;
}

export interface WalletUpdateData {
  balance?: number;
  currency?: string;
  amount?: number;
  type?: string;
  transactionId?: string;
  timestamp?: number;
}

export interface AuctionBidData {
  listingId: string;
  bidder: string;
  amount: number;
  previousBid?: number;
  bidCount?: number;
  timestamp?: number;
}

export interface ListingUpdateData {
  listingId: string;
  title?: string;
  updates?: Record<string, unknown>;
  soldTo?: string;
  price?: number;
  timestamp?: number;
}