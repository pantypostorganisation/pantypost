// src/services/websocket.service.ts

import { io, Socket } from 'socket.io-client';
import { 
  WebSocketEvent, 
  WebSocketState, 
  WebSocketMessage, 
  WebSocketOptions, 
  WebSocketHandler,
  WebSocketError 
} from '@/types/websocket';

class WebSocketService {
  private state: WebSocketState = WebSocketState.DISCONNECTED;
  private options: WebSocketOptions;
  private handlers: Map<WebSocketEvent, Set<WebSocketHandler>> = new Map();
  private socket: Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  constructor(options: Partial<WebSocketOptions> = {}) {
    this.options = {
      url: options.url || '',
      autoConnect: options.autoConnect ?? true,
      reconnect: options.reconnect ?? true,
      reconnectAttempts: options.reconnectAttempts ?? 5,
      reconnectDelay: options.reconnectDelay ?? 3000,
      auth: options.auth || {}
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  // Connect to WebSocket server
  connect(): void {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      return;
    }

    console.log('[WebSocket] Connecting to:', this.options.url);
    this.setState(WebSocketState.CONNECTING);

    // Create Socket.IO connection
    this.socket = io(this.options.url, {
      auth: this.options.auth,
      transports: ['websocket', 'polling'],
      reconnection: false, // We'll handle reconnection manually
    });

    // Set up Socket.IO event listeners
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected with ID:', this.socket?.id);
      this.setState(WebSocketState.CONNECTED);
      this.reconnectAttempts = 0;
      this.emit(WebSocketEvent.CONNECT, { connected: true, id: this.socket?.id });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.setState(WebSocketState.DISCONNECTED);
      this.emit(WebSocketEvent.DISCONNECT, { connected: false, reason });
      
      // Attempt reconnection if enabled and not a manual disconnect
      if (this.options.reconnect && reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.setState(WebSocketState.ERROR);
      this.emit(WebSocketEvent.ERROR, { 
        message: error.message,
        type: error.type || 'connection_error'
      } as WebSocketError);
    });

    // Listen for custom events from backend
    this.setupEventListeners();
  }

  // Set up listeners for all custom events
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection confirmation (custom event from your backend)
    this.socket.on('connected', (data: any) => {
      console.log('[WebSocket] Connection confirmed:', data);
    });

    // Message events
    this.socket.on('message:new', (data: any) => {
      this.emit(WebSocketEvent.MESSAGE_NEW, data);
    });

    this.socket.on('message:typing', (data: any) => {
      this.emit(WebSocketEvent.MESSAGE_TYPING, data);
    });

    this.socket.on('message:read', (data: any) => {
      this.emit(WebSocketEvent.MESSAGE_READ, data);
    });

    // Order events
    this.socket.on('order:new', (data: any) => {
      this.emit(WebSocketEvent.ORDER_NEW, data);
    });

    this.socket.on('order:status_change', (data: any) => {
      this.emit(WebSocketEvent.ORDER_STATUS_CHANGE, data);
    });

    // Wallet events
    this.socket.on('wallet:balance_update', (data: any) => {
      this.emit(WebSocketEvent.WALLET_BALANCE_UPDATE, data);
    });

    this.socket.on('wallet:transaction', (data: any) => {
      this.emit(WebSocketEvent.WALLET_TRANSACTION, data);
    });

    // Auction events
    this.socket.on('auction:bid', (data: any) => {
      this.emit(WebSocketEvent.AUCTION_BID, data);
    });

    this.socket.on('auction:outbid', (data: any) => {
      this.emit(WebSocketEvent.AUCTION_OUTBID, data);
    });

    this.socket.on('auction:ended', (data: any) => {
      this.emit(WebSocketEvent.AUCTION_ENDED, data);
    });

    // User status events
    this.socket.on('user:online', (data: any) => {
      if (data.isOnline) {
        this.emit(WebSocketEvent.USER_ONLINE, data);
      } else {
        this.emit(WebSocketEvent.USER_OFFLINE, data);
      }
    });

    // Notification events
    this.socket.on('notification:new', (data: any) => {
      this.emit(WebSocketEvent.NOTIFICATION_NEW, data);
    });

    // Subscription events
    this.socket.on('subscription:new', (data: any) => {
      this.emit(WebSocketEvent.SUBSCRIPTION_NEW, data);
    });

    this.socket.on('subscription:cancelled', (data: any) => {
      this.emit(WebSocketEvent.SUBSCRIPTION_CANCELLED, data);
    });

    // Listing events
    this.socket.on('listing:new', (data: any) => {
      this.emit(WebSocketEvent.LISTING_NEW, data);
    });

    this.socket.on('listing:sold', (data: any) => {
      this.emit(WebSocketEvent.LISTING_SOLD, data);
    });

    // Generic event listener for debugging
    this.socket.onAny((eventName: string, ...args: any[]) => {
      console.log('[WebSocket] Received event:', eventName, args);
    });
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setState(WebSocketState.DISCONNECTED);
  }

  // Subscribe to WebSocket events
  on<T = any>(event: WebSocketEvent, handler: WebSocketHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      }
    };
  }

  // Emit event to all handlers
  private emit(event: WebSocketEvent, data: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for ${event}:`, error);
        }
      });
    }
  }

  // Send message through WebSocket
  send(event: string, data: any): void {
    if (!this.socket || this.state !== WebSocketState.CONNECTED) {
      console.warn('[WebSocket] Not connected, cannot send:', event);
      return;
    }

    // Send through Socket.IO
    this.socket.emit(event, data);
    console.log('[WebSocket] Sent event:', event, data);
  }

  // Get current connection state
  getState(): WebSocketState {
    return this.state;
  }

  // Check if connected
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  // Set connection state
  private setState(newState: WebSocketState): void {
    this.state = newState;
    console.log(`[WebSocket] State changed to: ${newState}`);
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (!this.options.reconnect || this.reconnectAttempts >= this.options.reconnectAttempts!) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.setState(WebSocketState.ERROR);
      this.emit(WebSocketEvent.ERROR, { 
        message: 'Max reconnection attempts reached' 
      } as WebSocketError);
      return;
    }

    this.reconnectAttempts++;
    this.setState(WebSocketState.RECONNECTING);

    console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectDelay);
  }

  // Clean up resources
  destroy(): void {
    this.disconnect();
    this.handlers.clear();
  }
}

// Create singleton instance
let instance: WebSocketService | null = null;

export const createWebSocketService = (options: Partial<WebSocketOptions>): WebSocketService => {
  if (!instance) {
    instance = new WebSocketService(options);
  }
  return instance;
};

export const getWebSocketService = (): WebSocketService | null => {
  return instance;
};

export const destroyWebSocketService = (): void => {
  if (instance) {
    instance.destroy();
    instance = null;
  }
};

export default WebSocketService;