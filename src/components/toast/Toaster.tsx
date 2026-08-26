// src/components/toast/Toaster.tsx
//
// The single renderer for the toast bus (see toaster.ts). Mounted once
// in ClientLayout. Bottom-centre on phones, bottom-right on desktop.
// Errors use role="alert" so screen readers announce them immediately;
// success/info use polite status. Four-second auto-dismiss, manual X,
// stack capped at four so a burst of failures cannot wallpaper the
// screen. Design system: surface tokens, rounded-lg, lucide icons,
// variant expressed as a left accent bar -- no new colours invented.

'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToToasts, type ToastItem, type ToastVariant } from './toaster';

const AUTO_DISMISS_MS = 4000;
const MAX_STACK = 4;

const ACCENT: Record<ToastVariant, string> = {
  success: 'bg-green-500',
  error: 'bg-danger',
  info: 'bg-primary',
};

const ICON: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="w-4 h-4 text-green-400 shrink-0" aria-hidden="true" />,
  error: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />,
  info: <Info className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />,
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToToasts((t) => {
      setToasts((prev) => [...prev.slice(-(MAX_STACK - 1)), t]);
      const timer = setTimeout(() => dismiss(t.id), AUTO_DISMISS_MS);
      timers.current.set(t.id, timer);
    });
    const timersAtMount = timers.current;
    return () => {
      unsubscribe();
      timersAtMount.forEach((timer) => clearTimeout(timer));
      timersAtMount.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[70] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-96"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          className="relative flex items-start gap-3 overflow-hidden rounded-lg border border-white/10 bg-surface-raised py-3 pl-4 pr-10 shadow-lg"
        >
          <span className={`absolute inset-y-0 left-0 w-1 ${ACCENT[t.variant]}`} aria-hidden="true" />
          <span className="mt-0.5">{ICON[t.variant]}</span>
          <p className="text-sm leading-snug text-gray-200 break-words">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="absolute right-2 top-2 rounded-sm p-1 text-ink-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
