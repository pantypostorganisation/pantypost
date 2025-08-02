// src/app/ClientLayout.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import BanCheck from '@/components/BanCheck';
import MessageNotifications from '@/components/MessageNotifications';
import { MockApiDevTools } from '@/components/MockApiDevTools';
import { PWAInstall } from '@/components/PWAInstall';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { errorTracker } from '@/lib/errorTracking';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// Simple loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff950e] mx-auto mb-4"></div>
        <p className="text-gray-400">Loading PantyPost...</p>
      </div>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Define routes where header should be hidden
  const hideHeaderRoutes = [
    '/login',
    '/signup',
    '/reset-password',
    '/forgot-password',
    '/verify-reset-code',
    '/reset-password-final'
  ];

  // Check if current route should hide header
  // Using exact match to avoid issues with similar route names
  const shouldHideHeader = hideHeaderRoutes.some(route => {
    // Exact match or starts with route followed by query params or hash
    return pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '#');
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('SW registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      });
    }
  }, []);

  // Initialize error tracking
  useEffect(() => {
    errorTracker.initialize();
  }, []);

  // Initialize performance monitoring
  usePerformanceMonitoring();

  // Debug log for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Current pathname:', pathname);
      console.log('Should hide header:', shouldHideHeader);
    }
  }, [pathname, shouldHideHeader]);

  // Prevent SSR/hydration issues by only rendering after mount
  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <>
      {/* Google Analytics */}
      <GoogleAnalytics />
      
      <Providers>
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-black text-white">
            <BanCheck>
              {!shouldHideHeader && <Header />}
              <main className="flex-grow">
                {children}
              </main>
              <AgeVerificationModal />
              <MessageNotifications />
            </BanCheck>
          </div>
        </Suspense>
        {/* PWA Install Prompt */}
        <PWAInstall />
        {/* Mock API Dev Tools - Outside BanCheck so it's always accessible during development */}
        <MockApiDevTools />
      </Providers>
    </>
  );
}