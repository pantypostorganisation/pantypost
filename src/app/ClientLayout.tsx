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

// Simple loading component - black screen only
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black" />
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  
  const shouldHideHeader = hideHeaderRoutes.some(route => {
    return pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '#');
  }) || (isMessagesPage && isMobile); // Hide header on mobile messages pages

  useEffect(() => {
    setMounted(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Trigger fade-in after a tiny delay
    const fadeTimer = setTimeout(() => {
      setFadeIn(true);
    }, 50);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(fadeTimer);
    };
  }, []);

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
      console.log('Should hide header:', shouldHideHeader);
    }
  }, [pathname, shouldHideHeader, isMobile, isMessagesPage]);

  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <>
      {/* Google Analytics */}
      <GoogleAnalytics />
      
      <Providers>
        <Suspense fallback={<LoadingFallback />}>
          <div 
            className={`flex flex-col fullscreen md:min-h-screen bg-black text-white transition-opacity duration-1000 ${
              fadeIn ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <BanCheck>
              {!shouldHideHeader && <Header />}
              <main className="flex-1">
                {children}
              </main>
              <AgeVerificationModal />
              {/* Keep message area if you still want DM popups; remove the next line if you don't want message popups either */}
              <MessageNotifications />
              {/* NOTICE: No NotificationToaster mounted here */}
            </BanCheck>
          </div>
        </Suspense>
        {/* PWA Install Prompt */}
        <PWAInstall />
      </Providers>
    </>
  );
}
