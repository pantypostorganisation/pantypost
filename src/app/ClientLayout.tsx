// src/app/ClientLayout.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import AgeGate from '@/components/AgeGate';
import BanCheck from '@/components/BanCheck';
import Footer from '@/components/homepage/Footer';
import MessageNotifications from '@/components/MessageNotifications';
import { PWAInstall } from '@/components/PWAInstall';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { errorTracker } from '@/lib/errorTracking';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

// SILENT loading - no spinner, just black screen
function LoadingFallback() {
  return <div className="min-h-screen bg-black" />;
}

/* =====================================================================
 * AGE GATE ROUTING
 *
 * Everything is gated unless it appears below. This is deliberate:
 * an allow-list fails CLOSED, so a page added next month is protected
 * automatically. A block-list would fail open, and the page nobody
 * remembered to add is exactly the one a regulator finds.
 * ===================================================================== */

/** Routes reachable without having passed age verification. */
const AGE_GATE_EXEMPT_EXACT = [
  '/',                          // marketing homepage — no adult content
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/reset-password-final',
  '/verify-reset-code',
  '/verify-email',
  '/verify-email-pending',
  '/email-verified',
  '/maintenance',
  '/offline',

  // Admin wallet dashboard lives outside /admin but is still a staff
  // surface, so it is exempt alongside the rest of the admin tools.
  '/wallet/admin',

  // Policy and compliance pages must stay reachable by anyone, including
  // people with no account who need the complaints process.
  '/terms',
  '/privacy',
  '/content-policy',
  '/complaints',
  '/age-verification',
  '/age-verification/complete',
  '/help',
];

/** Prefixes that are exempt along with everything beneath them. */
const AGE_GATE_EXEMPT_PREFIXES = [
  '/blog',    // public SEO content, no adult material
  '/admin',   // staff tools; admins are not consumers of the marketplace

  // Signup must include its sub-routes: /signup/[referralCode] is how
  // referred users arrive, and they cannot possibly have verified yet.
  // Gating it would break the referral flow entirely.
  '/signup',
];

function isAgeGateExempt(pathname: string): boolean {
  if (!pathname) return true;

  // Ignore any query string or hash when matching.
  const path = pathname.split('?')[0].split('#')[0];

  if (AGE_GATE_EXEMPT_EXACT.includes(path)) return true;

  return AGE_GATE_EXEMPT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + '/')
  );
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
    '/reset-password-final',
    '/verify-email-pending',
    '/verify-email',
    '/email-verified'
  ];

  // Check if we're on a messages page on mobile
  const isMessagesPage = pathname === '/buyers/messages' || pathname === '/sellers/messages';
  
  // Only hide header if on mobile messages page WITH an active thread
  const shouldHideHeader = hideHeaderRoutes.some(route => {
    return pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '#');
  }) || (isMessagesPage && isMobile && hasActiveThread);

  const requiresAgeVerification = !isAgeGateExempt(pathname);

  /* The footer carries the Complaints & Content Removal link, which our
     payment processor requires to be reachable from every page without
     an account. It previously rendered only on the homepage.

     Excluded from: the homepage, which renders its own animated copy;
     the auth pages, which have their own compact footers; and the
     full-height messaging views, where a footer would break the
     fixed-height layout. */
  const hideFooterRoutes = [
    ...hideHeaderRoutes,
    '/buyers/messages',
    '/sellers/messages',
    '/admin/messages',
    '/maintenance',
    '/offline',
  ];

  const shouldHideFooter =
    pathname === '/' ||
    hideFooterRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

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
      console.log('Requires age verification:', requiresAgeVerification);
    }
  }, [pathname, shouldHideHeader, isMobile, isMessagesPage, hasActiveThread, requiresAgeVerification]);

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
                {/*
                  Gated routes render inside AgeGate, which shows the
                  verification prompt to signed-in users who have not
                  passed the check. Signed-out visitors pass straight
                  through — route protection is handled elsewhere, and
                  AgeGate has nothing to say about them.

                  To roll this out gently, pass block={false} instead:
                  users then see a dismissible banner rather than being
                  stopped.
                */}
                {requiresAgeVerification ? (
                  <AgeGate>{children}</AgeGate>
                ) : (
                  children
                )}
              </main>
              {!shouldHideFooter && <Footer />}
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