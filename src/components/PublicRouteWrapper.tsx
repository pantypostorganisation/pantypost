// src/components/PublicRouteWrapper.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface PublicRouteWrapperProps {
  children: React.ReactNode;
}

// List of public routes that should never redirect
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-reset-code',
  '/reset-password-final',
  '/reset-password',
] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]);
}

export default function PublicRouteWrapper({ children }: PublicRouteWrapperProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Mark this as a public route in window object
    if (typeof window !== 'undefined') {
      (window as any).__IS_PUBLIC_ROUTE__ = isPublicPath(pathname);
      (window as any).__PUBLIC_ROUTE_PATH__ = pathname;
      if (process.env.NODE_ENV === 'development') {
        console.log('[PublicRouteWrapper] Marked as public route:', sanitizeStrict(pathname));
      }
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__IS_PUBLIC_ROUTE__;
        delete (window as any).__PUBLIC_ROUTE_PATH__;
      }
    };
  }, [pathname]);

  // Prevent accidental redirects while on a public route (only for same-origin client-side transitions)
  useEffect(() => {
    if (!isPublicPath(pathname)) return;

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const guard = (fn: typeof history.pushState) =>
      function (this: unknown, ...args: any[]) {
        try {
          const urlLike = args[2];
          const urlStr = typeof urlLike === 'string' ? urlLike : String(urlLike ?? '');
          // Allow navigation between public routes
          if (PUBLIC_ROUTES.some((route) => urlStr.includes(route))) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[PublicRouteWrapper] Allowing navigation to public route:', sanitizeStrict(urlStr));
            }
            return fn.apply(history, args as any);
          }
          // Block all other navigation attempts initiated during public flows
          if (process.env.NODE_ENV === 'development') {
            console.warn('[PublicRouteWrapper] Blocked navigation from public route:', sanitizeStrict(urlStr));
          }
          return null;
        } catch {
          // On any parsing error, fail closed (block)
          return null;
        }
      };

    history.pushState = guard(originalPushState) as typeof history.pushState;
    history.replaceState = guard(originalReplaceState) as typeof history.replaceState;

    // Restore on cleanup
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [pathname]);

  return <>{children}</>;
}
