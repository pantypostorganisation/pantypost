// src/hooks/usePublicWebSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiConfig } from '@/config/environment';

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
      const wsUrl = apiConfig.baseUrl
        .replace('/api', '')
        .replace(/^http/, 'ws');

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