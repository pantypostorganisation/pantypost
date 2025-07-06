// src/services/websocket.service.ts

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
  private socket: any = null; // Will be Socket.IO instance later
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

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

  // Connect to WebSocket server (placeholder for now)
  connect(): void {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      return;
    }

    console.log('[WebSocket] Connecting...');
    this.setState(WebSocketState.CONNECTING);

    // For now, we'll simulate a connection and use polling
    // This will be replaced with actual Socket.IO connection later
    setTimeout(() => {
      this.setState(WebSocketState.CONNECTED);
      this.emit(WebSocketEvent.CONNECT, { connected: true });
      this.startPolling();
    }, 1000);
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    
    this.stopPolling();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setState(WebSocketState.DISCONNECTED);
    this.emit(WebSocketEvent.DISCONNECT, { connected: false });
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

  // Send message through WebSocket (will queue if not connected)
  send(event: WebSocketEvent, data: any): void {
    if (this.state !== WebSocketState.CONNECTED) {
      console.warn('[WebSocket] Not connected, message queued:', event);
      // In a real implementation, we'd queue this message
      return;
    }

    const message: WebSocketMessage = {
      event,
      data,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    // For now, just log it. Will send through Socket.IO later
    console.log('[WebSocket] Sending message:', message);
  }

  // Get current connection state
  getState(): WebSocketState {
    return this.state;
  }

  // Check if connected
  isConnected(): boolean {
    return this.state === WebSocketState.CONNECTED;
  }

  // Start polling for updates (temporary until Socket.IO)
  private startPolling(): void {
    // Poll for new messages every 5 seconds
    const messagePolling = setInterval(() => {
      if (this.state === WebSocketState.CONNECTED) {
        // This would check for new messages from your API
        // For now, it's just a placeholder
        console.log('[WebSocket] Polling for messages...');
      }
    }, 5000);

    this.pollingIntervals.set('messages', messagePolling);

    // Poll for online status every 30 seconds
    const statusPolling = setInterval(() => {
      if (this.state === WebSocketState.CONNECTED) {
        console.log('[WebSocket] Polling for online status...');
      }
    }, 30000);

    this.pollingIntervals.set('status', statusPolling);
  }

  // Stop all polling
  private stopPolling(): void {
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
  }

  // Set connection state
  private setState(newState: WebSocketState): void {
    this.state = newState;
    console.log(`[WebSocket] State changed to: ${newState}`);
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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