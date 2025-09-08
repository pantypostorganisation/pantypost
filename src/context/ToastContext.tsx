// src/context/ToastContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { sanitizeStrict } from '@/utils/security/sanitization';

// =================== Types ===================

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean; // if true, will not auto-dismiss
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

  // Promise helper
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

// =================== Config ===================

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  info: 5000,
  warning: 5000,
  loading: 0, // no auto-dismiss for loading
};

const TOAST_ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const TOAST_COLORS: Record<
  ToastType,
  { bg: string; border: string; icon: string }
> = {
  success: { bg: 'bg-green-900/20', border: 'border-green-700', icon: 'text-green-400' },
  error: { bg: 'bg-red-900/20', border: 'border-red-700', icon: 'text-red-400' },
  info: { bg: 'bg-blue-900/20', border: 'border-blue-700', icon: 'text-blue-400' },
  warning: { bg: 'bg-yellow-900/20', border: 'border-yellow-700', icon: 'text-yellow-400' },
  loading: { bg: 'bg-gray-900/20', border: 'border-gray-700', icon: 'text-[#ff950e]' },
};

// Practical cap to avoid runaway toasts
const MAX_TOASTS = 8;
const MIN_DURATION = 1000;
const MAX_DURATION = 30000;

// =================== Helpers ===================

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const clampDuration = (ms?: number, persistent?: boolean) => {
  if (persistent) return 0;
  if (typeof ms !== 'number' || !isFinite(ms)) return undefined;
  return clamp(Math.round(ms), MIN_DURATION, MAX_DURATION);
};

const sanitizeTitle = (v: string) => sanitizeStrict(String(v)).slice(0, 100);
const sanitizeMessage = (v?: string) =>
  typeof v === 'string' ? sanitizeStrict(String(v)).slice(0, 500) : undefined;
const sanitizeLabel = (v: string) => sanitizeStrict(String(v)).slice(0, 50);

const normalizeType = (t: ToastType): ToastType =>
  ['success', 'error', 'info', 'warning', 'loading'].includes(t) ? t : 'info';

const sanitizeToastInput = (toast: Omit<Toast, 'id'>): Omit<Toast, 'id'> => {
  const type = normalizeType(toast.type);
  const persistent = !!toast.persistent || type === 'loading';

  return {
    ...toast,
    type,
    title: sanitizeTitle(toast.title),
    message: sanitizeMessage(toast.message),
    duration:
      toast.duration != null
        ? clampDuration(toast.duration, persistent)
        : DEFAULT_DURATIONS[type],
    dismissible: toast.dismissible ?? true,
    persistent,
    action: toast.action
      ? { label: sanitizeLabel(toast.action.label), onClick: toast.action.onClick }
      : undefined,
  };
};

// Imperative API bridge (safe to call outside React)
type ExternalAPI = Pick<
  ToastContextType,
  'showToast' | 'updateToast' | 'removeToast' | 'success' | 'error' | 'info' | 'warning' | 'loading'
>;
let externalToastAPI: ExternalAPI | null = null;

// =================== Provider ===================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const generateId = () =>
    `toast_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const scheduleAutoDismiss = useCallback(
    (id: string, duration?: number, persistent?: boolean) => {
      // Clear any existing timer
      const existing = timersRef.current.get(id);
      if (existing) {
        clearTimeout(existing);
        timersRef.current.delete(id);
      }
      if (!persistent && duration && duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const showToast = useCallback(
    (rawToast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const sanitized = sanitizeToastInput(rawToast);
      const newToast: Toast = { ...sanitized, id };

      setToasts(prev => {
        const next = [...prev, newToast];
        // enforce cap (keep newest)
        return next.slice(-MAX_TOASTS);
      });

      scheduleAutoDismiss(id, newToast.duration, newToast.persistent);
      return id;
    },
    [scheduleAutoDismiss]
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Toast>) => {
      setToasts(prev => {
        let found: Toast | undefined;
        const next = prev.map(t => {
          if (t.id !== id) return t;

          // Merge & sanitize fields being updated
          const merged: Toast = {
            ...t,
            ...(updates.type ? { type: normalizeType(updates.type) } : null),
            ...(updates.title != null ? { title: sanitizeTitle(updates.title) } : null),
            ...(updates.message !== undefined
              ? { message: sanitizeMessage(updates.message) }
              : null),
            ...(updates.action
              ? {
                  action: {
                    label:
                      updates.action.label != null
                        ? sanitizeLabel(updates.action.label)
                        : t.action?.label ?? '',
                    onClick: updates.action.onClick ?? t.action?.onClick ?? (() => {}),
                  },
                }
              : null),
            ...(updates.dismissible != null ? { dismissible: updates.dismissible } : null),
            ...(updates.persistent != null ? { persistent: updates.persistent } : null),
          };

          // Duration handling after persistent normalization
          const finalPersistent = merged.persistent ?? t.persistent ?? false;
          if (updates.duration !== undefined) {
            merged.duration = clampDuration(updates.duration, finalPersistent);
          } else if (updates.type) {
            // If type changed and no explicit duration, refresh default
            merged.duration = DEFAULT_DURATIONS[merged.type];
          }

          found = merged;
          return merged;
        });

        // If we updated duration/persistence, (re)schedule timer
        if (found) {
          scheduleAutoDismiss(found.id, found.duration, found.persistent);
        }
        return next;
      });
    },
    [scheduleAutoDismiss]
  );

  const clearToasts = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const loading = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'loading', title, message, persistent: true }),
    [showToast]
  );

  const promise = useCallback(
    async <T,>(
      p: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ): Promise<T> => {
      const id = loading(messages.loading);
      try {
        const result = await p;
        const successMsg =
          typeof messages.success === 'function' ? messages.success(result) : messages.success;

        updateToast(id, {
          type: 'success',
          title: successMsg,
          message: undefined,
          duration: DEFAULT_DURATIONS.success,
          persistent: false,
        });

        return result;
      } catch (err: any) {
        const errorMsg =
          typeof messages.error === 'function' ? messages.error(err) : messages.error;

        updateToast(id, {
          type: 'error',
          title: errorMsg,
          message: err?.message ? String(err.message).slice(0, 200) : undefined,
          duration: DEFAULT_DURATIONS.error,
          persistent: false,
        });

        throw err;
      }
    },
    [loading, updateToast]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  // Expose imperative API safely for non-React callers
  useEffect(() => {
    externalToastAPI = { showToast, updateToast, removeToast, success, error, info, warning, loading };
    return () => {
      externalToastAPI = null;
    };
  }, [showToast, updateToast, removeToast, success, error, info, warning, loading]);

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

// =================== UI ===================

function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];

  // Use polite for info/success/warning, assertive for error, off for loading (spinner)
  const ariaLive =
    toast.type === 'error' ? 'assertive' : toast.type === 'loading' ? 'off' : 'polite';

  return (
    <motion.div
      role="status"
      aria-live={ariaLive as 'polite' | 'assertive' | 'off'}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto mb-3"
    >
      <div
        className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg p-4 max-w-sm min-w-[300px] backdrop-blur-sm`}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={`w-5 h-5 ${colors.icon} flex-shrink-0 ${
              toast.type === 'loading' ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">{toast.title}</h3>

            {toast.message && (
              <p className="text-xs text-gray-400 mt-1">{toast.message}</p>
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
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =================== Hooks & Helpers ===================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Imperative helper to show an API error toast (safe outside React components).
 * If the ToastProvider hasn't mounted yet, this will no-op.
 */
export function toastApiError(error: any, fallbackMessage = 'An error occurred') {
  if (!externalToastAPI) return;

  let message = fallbackMessage;
  if (error?.response?.data?.error?.message) {
    message = String(error.response.data.error.message);
  } else if (error?.message) {
    message = String(error.message);
  }

  externalToastAPI.error('Error', message);
}
