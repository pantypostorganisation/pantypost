// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException as Error;
        
        // Ignore network errors in development
        if (process.env.NODE_ENV === 'development' && 
            error?.message?.includes('NetworkError')) {
          return null;
        }
        
        // Ignore ResizeObserver errors
        if (error?.message?.includes('ResizeObserver')) {
          return null;
        }
      }
      
      return event;
    },
  });
}