// src/components/PublicRouteWrapper.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  '/reset-password'
];

export default function PublicRouteWrapper({ children }: PublicRouteWrapperProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Mark this as a public route in window object
    if (typeof window !== 'undefined') {
      (window as any).__IS_PUBLIC_ROUTE__ = PUBLIC_ROUTES.includes(pathname);
      (window as any).__PUBLIC_ROUTE_PATH__ = pathname;
      
      console.log('[PublicRouteWrapper] Marked as public route:', pathname);
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__IS_PUBLIC_ROUTE__;
        delete (window as any).__PUBLIC_ROUTE_PATH__;
      }
    };
  }, [pathname]);

  // Prevent any redirects on public routes
  useEffect(() => {
    if (!PUBLIC_ROUTES.includes(pathname)) return;

    // Store original router methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override history methods to prevent redirects
    history.pushState = function(...args) {
      const url = args[2]?.toString() || '';
      
      // Allow navigation between public routes
      if (PUBLIC_ROUTES.some(route => url.includes(route))) {
        console.log('[PublicRouteWrapper] Allowing navigation to public route:', url);
        return originalPushState.apply(history, args);
      }
      
      // Block all other navigation
      console.warn('[PublicRouteWrapper] Blocked navigation from public route:', url);
      return null;
    };

    history.replaceState = function(...args) {
      const url = args[2]?.toString() || '';
      
      // Allow navigation between public routes
      if (PUBLIC_ROUTES.some(route => url.includes(route))) {
        console.log('[PublicRouteWrapper] Allowing replace to public route:', url);
        return originalReplaceState.apply(history, args);
      }
      
      // Block all other navigation
      console.warn('[PublicRouteWrapper] Blocked replace from public route:', url);
      return null;
    };

    // Restore on cleanup
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [pathname]);

  return <>{children}</>;
}