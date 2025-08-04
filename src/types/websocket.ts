/**
 * WebSocket connection states
 */
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * WebSocket event handler type
 */
export type WebSocketHandler = (data: any) => void;

/**
 * Typing indicator data
 */
export interface TypingData {
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: string;
}

/**
 * Online status data
 */
export interface OnlineStatusData {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen?: string;
}

/**
 * Real-time notification data
 */
export interface RealtimeNotification {
  id: string;
  type: 'message' | 'order' | 'bid' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
}// src/types/websocket.ts

/**
 * WebSocket event types used throughout the application
 */
export enum WebSocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication events
  AUTH_SUCCESS = 'auth:success',
  AUTH_ERROR = 'auth:error',
  
  // Message events
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  MESSAGE_UPDATE = 'message:update',
  MESSAGE_DELETE = 'message:delete',
  
  // Wallet events
  WALLET_BALANCE_UPDATE = 'wallet:balance:update',
  WALLET_TRANSACTION = 'wallet:transaction',
  WALLET_DEPOSIT = 'wallet:deposit',
  WALLET_WITHDRAWAL = 'wallet:withdrawal',
  
  // Auction events
  AUCTION_BID = 'auction:bid',
  AUCTION_ENDED = 'auction:ended',
  AUCTION_CANCELLED = 'auction:cancelled',
  AUCTION_UPDATE = 'auction:update',
  
  // Listing events
  LISTING_NEW = 'listing:new',
  LISTING_UPDATE = 'listing:update',
  LISTING_DELETE = 'listing:delete',
  LISTING_SOLD = 'listing:sold',
  
  // Order events
  ORDER_NEW = 'order:new',
  ORDER_UPDATE = 'order:update',
  ORDER_SHIPPED = 'order:shipped',
  ORDER_DELIVERED = 'order:delivered',
  
  // User events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_UPDATE = 'user:update',
  
  // Custom request events
  REQUEST_NEW = 'request:new',
  REQUEST_UPDATE = 'request:update',
  REQUEST_ACCEPTED = 'request:accepted',
  REQUEST_DECLINED = 'request:declined',
  
  // Admin events
  ADMIN_NOTIFICATION = 'admin:notification',
  ADMIN_ACTION = 'admin:action',
  
  // Generic message type for custom events
  MESSAGE = 'message'
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketEvent | string;
  data: T;
  timestamp: string;
  userId?: string;
}

/**
 * WebSocket context type
 */
export interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (event: WebSocketEvent | string, handler: (data: any) => void) => () => void;
  send: (event: WebSocketEvent | string, data: any) => void;
  lastMessage: WebSocketMessage | null;
}