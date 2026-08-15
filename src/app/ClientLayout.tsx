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
  // Matches the shell below; bg-black here would flash a slightly
  // different black before the app paints.
  return <div className="min-h-screen bg-surface" />;
}

/* =====================================================================
 * WHY THERE IS NO `mounted` GATE HERE
 *
 * This component used to open with:
 *
 *     const [mounted, setMounted] = useState(false);
 *     useEffect(() => setMounted(true), []);
 *     if (!mounted) return <LoadingFallback />;
 *
 * `mounted` is only ever set inside an effect, and effects do not run
 * during server rendering. So the server's answer for EVERY route on the
 * site — homepage, policy pages, browse, seller shops, both blog guides —
 * was one empty black div. A crawler received <head> metadata and nothing
 * else. Not because the pages are client components (client components do
 * server-render in the App Router) but because four lines threw the body
 * away before it was serialised.
 *
 * Nothing below needs the gate. `isMobile` and `hasActiveThread` both
 * start false on the server AND on the client's first render, so
 * hydration matches; their effects run afterwards. The fade-in is now a
 * pure CSS animation rather than a state flip, so it needs no gate either.
 *
 * If you find yourself adding `if (!mounted)` here again, put it around
 * the specific thing that reads `window`, not around the whole tree.
 *
 * Note: AppInitializationProvider carried an identical gate and had to be
 * fixed at the same time — either one alone still blanks the page.
 * ===================================================================== */

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
  '/contact',
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
  const [isMobile, setIsMobile] = useState(false);
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

  /* Separate from isMessagesPage on purpose: that flag also drives
     header-hiding on mobile, and admin messaging shouldn't inherit that
     behaviour. This one only decides whether the shell is pinned to the
     viewport. */
  const isFixedHeightMessaging = isMessagesPage || pathname === '/admin/messages';

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
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
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

  return (
    <>
      {/* Google Analytics */}
      <GoogleAnalytics />

      <Providers>
        {/*
          NOTE: this boundary wraps the whole app, so any client component
          below that calls useSearchParams() makes the SERVER render this
          fallback instead of the page — an empty body again, for that
          route only. Today that is /browse/[id], the messages pages,
          /signup, the verify-email routes and /wallet/buyer.

          None of those are pages we need indexed right now, but when
          /browse/[id] gets its server wrapper it will need its own
          Suspense boundary lower down rather than relying on this one.
        */}
        <Suspense fallback={<LoadingFallback />}>
          {/*
            app-fade-in is a plain CSS animation (opacity 0 -> 1). It used
            to be driven by a `showContent` state flipped 100ms after
            mount, which meant the server emitted opacity-0 markup and the
            page sat blank for a beat. The animation gets us the same
            entrance without hiding anything from a crawler.
          */}
          {/*
            Messaging is a fixed-height app view: the thread list and the
            transcript scroll independently and nothing below the composer
            should ever scroll the document. Everything else is a normal
            document that grows with its content.

            Both message pages used to solve this themselves and got it
            wrong in opposite directions — the buyer page set h-[100dvh]
            *inside* this shell, which already renders a header, so the page
            was taller than the viewport; the seller page subtracted a
            hard-coded 64px for a header whose height isn't fixed and which
            is removed entirely on mobile once a thread is open, leaving a
            64px dead strip under the composer.

            Pinning the shell here instead means the pages just say h-full
            and inherit whatever is actually left over. No magic numbers.
          */}
          <div
            /* bg-surface, not bg-black. The pages use bg-surface
               (#050505) while this shell was pure #000, so anything
               transparent above it -- the footer especially -- sat five
               points darker than the page it belonged to. One token for
               the shell, the pages and the footer means they cannot
               drift apart again. */
            className={`flex flex-col bg-surface text-white app-fade-in ${
              isFixedHeightMessaging
                ? 'h-dvh overflow-hidden'
                : 'fullscreen md:min-h-screen'
            }`}
          >
            <BanCheck>
              {!shouldHideHeader && <Header />}
              {/* min-h-0 lets a flex child actually shrink; without it the
                  transcript's overflow-y-auto never engages and the whole
                  document scrolls instead. */}
              <main className={`flex-1 ${isFixedHeightMessaging ? 'min-h-0' : ''}`}>
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
