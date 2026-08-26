// src/components/toast/toaster.ts
//
// The toast bus. Import `toast` from anywhere -- components, hooks,
// even context providers -- and call toast.error(...) / .success(...)
// / .info(...). No React context involved, so there is no provider
// ordering to get wrong: the <Toaster /> renderer (mounted once in
// ClientLayout) subscribes to this module, and pushes render there.
//
// This replaced 34 window.alert() calls across the app. If the
// renderer is somehow not mounted (should never happen in the app
// shell), we fall back to alert() rather than silently swallowing
// user feedback -- the one failure mode worse than an ugly popup.

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (t: ToastItem) => void;

let listener: Listener | null = null;
let nextId = 1;

export function subscribeToToasts(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

function push(message: string, variant: ToastVariant): void {
  if (listener) {
    listener({ id: nextId++, message, variant });
  } else if (typeof window !== 'undefined') {
    window.alert(message);
  }
}

export const toast = {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error'),
  info: (message: string) => push(message, 'info'),
};
