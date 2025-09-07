// src/context/LoadingContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

interface LoadingContextType {
  // Global loading state
  globalLoading: LoadingState;
  setGlobalLoading: (loading: boolean, message?: string, progress?: number) => void;

  // Named loading states (for specific features)
  loadingStates: Map<string, LoadingState>;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  isLoading: (key: string) => boolean;

  // Utilities
  withLoading: <T>(key: string, fn: () => Promise<T>, message?: string) => Promise<T>;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// ----------------- Small, non-breaking guards -----------------
const MAX_MESSAGE_LEN = 200;

/** Trim and ensure a non-empty key. Returns null if invalid. */
function safeKey(key: string | undefined | null): string | null {
  if (key == null) return null;
  const k = String(key).trim();
  return k.length > 0 ? k : null;
}

/** Clamp progress into [0, 100]; coerce to number if needed. */
function safeProgress(progress: number | undefined): number | undefined {
  if (progress === undefined || progress === null) return undefined;
  const num = Number(progress);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(0, Math.min(100, num));
}

/** Cap rendered message to avoid UI overflow; preserve original if needed later. */
function safeMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  const m = String(message);
  return m.length > MAX_MESSAGE_LEN ? m.slice(0, MAX_MESSAGE_LEN) + '…' : m;
}
// ---------------------------------------------------------------

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  // Keep Map instance stable to avoid breaking existing consumers
  const [loadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [, forceUpdate] = useState({});
  // Reference counter to support overlapping loads on the same key
  const loadingCountRef = useRef<Map<string, number>>(new Map());

  // Set global loading
  const setGlobalLoading = useCallback((isLoading: boolean, message?: string, progress?: number) => {
    setGlobalLoadingState({
      isLoading,
      message: safeMessage(message),
      progress: safeProgress(progress),
    });
  }, []);

  // Set named loading state
  const setLoading = useCallback(
    (key: string, isLoading: boolean, message?: string, progress?: number) => {
      const k = safeKey(key);
      if (!k) {
        // Ignore invalid keys to prevent map bloat/leaks
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[LoadingContext] setLoading called with empty/invalid key');
        }
        return;
      }

      if (isLoading) {
        // Increment loading count for this key
        const currentCount = loadingCountRef.current.get(k) || 0;
        loadingCountRef.current.set(k, currentCount + 1);

        loadingStates.set(k, {
          isLoading: true,
          message: safeMessage(message),
          progress: safeProgress(progress),
        });
      } else {
        // Decrement loading count
        const currentCount = loadingCountRef.current.get(k) || 0;
        const newCount = Math.max(0, currentCount - 1);

        if (newCount === 0) {
          loadingStates.delete(k);
          loadingCountRef.current.delete(k);
        } else {
          loadingCountRef.current.set(k, newCount);
          // Keep latest message/progress if still loading due to overlaps
          const prev = loadingStates.get(k);
          if (prev?.isLoading) {
            loadingStates.set(k, {
              ...prev,
              message: safeMessage(message ?? prev.message),
              progress: safeProgress(progress ?? prev.progress),
            });
          }
        }
      }

      // Force context consumers to re-render after mutating Map
      forceUpdate({});
    },
    [loadingStates]
  );

  // Check if specific key is loading
  const isLoading = useCallback(
    (key: string): boolean => {
      const k = safeKey(key);
      if (!k) return false;
      return loadingStates.has(k);
    },
    [loadingStates]
  );

  // Execute function with loading state
  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>, message?: string): Promise<T> => {
      const k = safeKey(key);
      if (!k) {
        // If invalid key, just run without tracking to avoid inconsistent state
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[LoadingContext] withLoading called with empty/invalid key');
        }
        return fn();
      }

      setLoading(k, true, message);
      try {
        return await fn();
      } finally {
        setLoading(k, false);
      }
    },
    [setLoading]
  );

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    loadingStates.clear();
    loadingCountRef.current.clear();
    setGlobalLoadingState({ isLoading: false });
    forceUpdate({});
  }, [loadingStates]);

  const value: LoadingContextType = {
    globalLoading,
    setGlobalLoading,
    loadingStates,
    setLoading,
    isLoading,
    withLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading.isLoading && <GlobalLoadingOverlay {...globalLoading} />}
    </LoadingContext.Provider>
  );
}

// Global Loading Overlay Component (accessible)
function GlobalLoadingOverlay({ message, progress }: LoadingState) {
  const clampedProgress = safeProgress(progress);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
      aria-hidden={false}
    >
      <div
        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={message ? `Loading: ${message}` : 'Loading'}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#ff950e] animate-spin" />
          {message && <p className="text-white text-sm font-medium">{safeMessage(message)}</p>}

          {clampedProgress !== undefined && (
            <div className="w-48">
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden" aria-hidden="true">
                <div
                  className="bg-[#ff950e] h-full transition-all duration-300"
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-1 text-center" aria-live="polite">
                {Math.round(clampedProgress)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to use loading
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Loading Spinner Component
export function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <Loader2 className={`animate-spin text-[#ff950e] ${sizeClasses[size]} ${className}`} />;
}

// Loading Button Component
export function LoadingButton({
  isLoading: isBtnLoading,
  children,
  loadingText,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
  loadingText?: string;
}) {
  return (
    <button
      disabled={isBtnLoading}
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-busy={isBtnLoading}
      {...props}
    >
      {isBtnLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          {loadingText || 'Loading...'}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
