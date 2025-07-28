// src/lib/errorTracking.ts

interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

declare global {
  interface Window {
    Sentry?: any;
  }
}

class ErrorTracker {
  private initialized = false;

  initialize() {
    if (this.initialized || typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleRejection);

    this.initialized = true;
  }

  private handleError = (event: ErrorEvent) => {
    this.captureError(event.error || new Error(event.message), {
      action: 'window_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  };

  private handleRejection = (event: PromiseRejectionEvent) => {
    this.captureError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      {
        action: 'unhandled_rejection',
        metadata: {
          reason: event.reason
        }
      }
    );
  };

  captureError(error: Error, context?: ErrorContext) {
    console.error('[ErrorTracker]', error, context);

    // Send to custom endpoint
    if (process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof window !== 'undefined' ? window.location.href : ''
        })
      }).catch(() => {
        // Fail silently
      });
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[ErrorTracker:${level}]`, message);
  }
}

export const errorTracker = new ErrorTracker();