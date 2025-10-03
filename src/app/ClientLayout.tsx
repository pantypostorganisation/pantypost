// src/app/ClientLayout.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import BanCheck from '@/components/BanCheck';
import MessageNotifications from '@/components/MessageNotifications';
import { PWAInstall } from '@/components/PWAInstall';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { errorTracker } from '@/lib/errorTracking';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// SILENT loading - no spinner, just black screen
function LoadingFallback() {
  return <div className="min-h-screen bg-black" />;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [hasActiveThread, setHasActiveThread] = useState(false);
  const pathname = usePathname();

  const hideHeaderRoutes = [
    '/login',
    '/signup',
    '/reset-password',
    '/forgot-password',
    '/verify-reset-code',
    '/reset-password-final'
  ];

  // Check if we're on a messages page on mobile
  const isMessagesPage = pathname === '/buyers/messages' || pathname === '/sellers/messages';
  
  // Only hide header if on mobile messages page WITH an active thread
  const shouldHideHeader = hideHeaderRoutes.some(route => {
    return pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '#');
  }) || (isMessagesPage && isMobile && hasActiveThread);

  useEffect(() => {
    setMounted(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Trigger fade-in after mount
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  // Listen for thread state changes from messages pages
  useEffect(() => {
    const handleThreadStateChange = (event: CustomEvent) => {
      console.log('Thread state changed:', event.detail);
      setHasActiveThread(event.detail.hasActiveThread);
    };

    window.addEventListener('threadStateChange', handleThreadStateChange as EventListener);
    
    return () => {
      window.removeEventListener('threadStateChange', handleThreadStateChange as EventListener);
    };
  }, []);

  // Reset thread state when navigating away from messages pages
  useEffect(() => {
    if (!isMessagesPage) {
      setHasActiveThread(false);
    }
  }, [isMessagesPage]);

  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('SW registered:', registration))
          .catch(error => console.log('SW registration failed:', error));
      });
    }
  }, []);

  useEffect(() => {
    errorTracker.initialize();
  }, []);

  usePerformanceMonitoring();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Current pathname:', pathname);
      console.log('Is mobile:', isMobile);
      console.log('Is messages page:', isMessagesPage);
      console.log('Has active thread:', hasActiveThread);
      console.log('Should hide header:', shouldHideHeader);
    }
  }, [pathname, shouldHideHeader, isMobile, isMessagesPage, hasActiveThread]);

  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <>
      {/* Google Analytics */}
      <GoogleAnalytics />
      
      <Providers>
        <Suspense fallback={<LoadingFallback />}>
          <div className={`flex flex-col fullscreen md:min-h-screen bg-black text-white ${showContent ? 'app-fade-in' : 'opacity-0'}`}>
            <BanCheck>
              {!shouldHideHeader && <Header />}
              <main className="flex-1">
                {children}
              </main>
              <AgeVerificationModal />
              <MessageNotifications />
            </BanCheck>
          </div>
        </Suspense>
        {/* PWA Install Prompt */}
        <PWAInstall />
      </Providers>
    </>
  );
}
