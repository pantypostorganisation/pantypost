// src/context/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  // Convenience methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  loading: (title: string, message?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Default durations by type
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  info: 5000,
  warning: 5000,
  loading: 0, // No auto-dismiss for loading
};

// Toast icons
const TOAST_ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

// Toast colors
const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-900/20',
    border: 'border-green-700',
    icon: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-700',
    icon: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-700',
    icon: 'text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-700',
    icon: 'text-yellow-400',
  },
  loading: {
    bg: 'bg-gray-900/20',
    border: 'border-gray-700',
    icon: 'text-[#ff950e]',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique ID
  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Show toast
  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? DEFAULT_DURATIONS[toast.type],
      dismissible: toast.dismissible ?? true,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss if duration is set and not persistent
    if (newToast.duration && !newToast.persistent) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, []);

  // Update toast
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id
          ? { ...toast, ...updates }
          : toast
      )
    );

    // Handle duration updates
    if (updates.duration !== undefined) {
      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        timersRef.current.delete(id);
      }

      if (updates.duration && !updates.persistent) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, updates.duration);
        timersRef.current.set(id, timer);
      }
    }
  }, []);

  // Remove toast
  const removeToast = useCallback((id: string) => {
    // Clear any existing timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string) => 
    showToast({ type: 'success', title, message }), [showToast]);
  
  const error = useCallback((title: string, message?: string) => 
    showToast({ type: 'error', title, message }), [showToast]);
  
  const info = useCallback((title: string, message?: string) => 
    showToast({ type: 'info', title, message }), [showToast]);
  
  const warning = useCallback((title: string, message?: string) => 
    showToast({ type: 'warning', title, message }), [showToast]);
  
  const loading = useCallback((title: string, message?: string) => 
    showToast({ type: 'loading', title, message, persistent: true }), [showToast]);

  // Promise handler
  const promise = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ): Promise<T> => {
    const id = loading(messages.loading);

    try {
      const result = await promise;
      const successMessage = typeof messages.success === 'function' 
        ? messages.success(result) 
        : messages.success;
      
      updateToast(id, { 
        type: 'success', 
        title: successMessage,
        message: undefined,
        duration: DEFAULT_DURATIONS.success,
        persistent: false,
      });
      
      return result;
    } catch (error) {
      const errorMessage = typeof messages.error === 'function' 
        ? messages.error(error) 
        : messages.error;
      
      updateToast(id, { 
        type: 'error', 
        title: errorMessage,
        message: error instanceof Error ? error.message : undefined,
        duration: DEFAULT_DURATIONS.error,
        persistent: false,
      });
      
      throw error;
    }
  }, [loading, updateToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value: ToastContextType = {
    toasts,
    showToast,
    updateToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning,
    loading,
    promise,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Toast Container Component
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Individual Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto mb-3"
    >
      <div className={`
        ${colors.bg} ${colors.border}
        border rounded-lg shadow-lg p-4
        max-w-sm min-w-[300px]
        backdrop-blur-sm
      `}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0 ${
            toast.type === 'loading' ? 'animate-spin' : ''
          }`} />
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              {toast.title}
            </h3>
            {toast.message && (
              <p className="text-xs text-gray-400 mt-1">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="text-xs text-[#ff950e] hover:text-[#ff7a00] mt-2 font-medium"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          {toast.dismissible && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Helper function for API errors
export function toastApiError(error: any, fallbackMessage = 'An error occurred') {
  const context = useContext(ToastContext);
  if (!context) return;

  let message = fallbackMessage;
  
  if (error?.response?.data?.error?.message) {
    message = error.response.data.error.message;
  } else if (error?.message) {
    message = error.message;
  }

  context.error('Error', message);
}
