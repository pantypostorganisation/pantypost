// src/hooks/usePublicWebSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { websocketConfig } from '@/config/environment';

interface PublicWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function usePublicWebSocket(options: PublicWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<Function>>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      // Use the websocketConfig.url directly from environment.ts
      // It's already set to 'wss://api.pantypost.com'
      const wsUrl = websocketConfig.url || 'wss://api.pantypost.com';
      
      console.log('[PublicWS] Connecting to:', wsUrl);

      socketRef.current = io(wsUrl, {
        path: '/public-ws',
        transports: ['websocket', 'polling'],
        autoConnect: options.autoConnect !== false,
        reconnection: options.reconnection !== false,
        reconnectionAttempts: options.reconnectionAttempts || 5,
        reconnectionDelay: options.reconnectionDelay || 3000,
      });

      socketRef.current.on('connect', () => {
        console.log('[PublicWS] Connected as guest');
        setIsConnected(true);
        setLastError(null);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[PublicWS] Disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        console.error('[PublicWS] Error:', error);
        setLastError(error as Error);
      });

      // Listen for stats updates
      socketRef.current.on('stats:users', (data: any) => {
        console.log('[PublicWS] Received stats update:', data);
        const handlers = handlersRef.current.get('stats:users');
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      });

      // Listen for new user registrations
      socketRef.current.on('user:registered', (data: any) => {
        console.log('[PublicWS] New user registered:', data);
        const handlers = handlersRef.current.get('user:registered');
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      });

      // Forward all events to registered handlers
      socketRef.current.onAny((event: string, ...args: any[]) => {
        const handlers = handlersRef.current.get(event);
        if (handlers) {
          handlers.forEach(handler => handler(...args));
        }
      });
    } catch (error) {
      console.error('[PublicWS] Failed to create socket:', error);
      setLastError(error as Error);
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const subscribe = useCallback((event: string, handler: Function) => {
    console.log('[PublicWS] Subscribing to event:', event);
    
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    lastError,
  };
}