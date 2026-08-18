// src/app/HomeClient.tsx
'use client';

import { Suspense, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BanCheck from '@/components/BanCheck';
import HeroSection from '@/components/homepage/HeroSection';
import TrustSignalsSection from '@/components/homepage/TrustSignalsSection';
import CTASection from '@/components/homepage/CTASection';
import Footer from '@/components/homepage/Footer';
import dynamic from 'next/dynamic';

// OPTIMIZED: Lazy load below-the-fold sections with custom loading states
const FeaturedRandom = dynamic(() => import('@/components/homepage/FeaturedRandom'), {
  loading: () => <FeaturedSkeleton />,
  ssr: true, // Enable SSR for SEO
});

const FeaturesSection = dynamic(() => import('@/components/homepage/FeaturesSection'), {
  loading: () => <FeaturesSkeleton />,
  ssr: true,
});

const FAQSection = dynamic(() => import('@/components/homepage/FAQSection'), {
  loading: () => <FAQSkeleton />,
  ssr: true,
});

// Lightweight loading skeletons
function FeaturedSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="mb-6 sm:mb-8">
        <div className="h-8 bg-gray-800/50 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-800/30 rounded w-64 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#131313] rounded-lg sm:rounded-lg border border-white/10 overflow-hidden">
            <div className="aspect-[4/5] sm:aspect-square bg-gray-800/50 animate-pulse"></div>
            <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
              <div className="h-4 sm:h-5 bg-gray-800/50 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-800/30 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSkeleton() {
  return (
    <div className="pt-16 pb-16 md:pt-20 md:pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <div className="h-10 bg-gray-800/50 rounded w-64 mx-auto mb-4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#131313] rounded-lg p-6 border border-white/10 animate-pulse">
              <div className="w-12 h-12 bg-gray-700 rounded-full mb-5"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQSkeleton() {
  return (
    <div className="pt-16 pb-16 md:pt-20 md:pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <div className="h-10 bg-gray-800/50 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-800/30 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#131313] rounded-lg p-6 sm:p-8 border border-white/10 animate-pulse">
              <div className="flex gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced section wrapper with better error handling
const SectionWrapper = ({ 
  children, 
  sectionName, 
  fallbackHeight 
}: { 
  children: React.ReactNode; 
  sectionName: string; 
  fallbackHeight?: string; 
}) => {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <ErrorBoundary 
      fallback={
        <div className={`${fallbackHeight || 'min-h-[200px]'} flex items-center justify-center`}>
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
            </div>
            <h3 className="text-red-400 font-semibold mb-2">Section Unavailable</h3>
            <p className="text-gray-500 text-sm mb-4">
              The {sectionName} section could not be loaded.
            </p>
            <button 
              onClick={handleRetry} 
              className="text-[#ff950e] text-sm hover:underline hover:text-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
            >
              Try Again
            </button>
          </div>
        </div>
      }
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default function HomeClient() {
  /* The two JSON-LD blocks that used to be assembled here moved to the
     server wrapper (page.tsx), where they belong -- a crawler should not
     need JavaScript to run before structured data exists.

     They also moved because one of them was a liability: an
     aggregateRating of 4.8 from a hard-coded 10,000 reviews, on a
     platform with two test accounts. Fabricated review markup is a
     Google structured-data spam violation -- the kind that draws a
     manual action -- and a fabricated claim sitting in the page source
     while a payment processor is reviewing the site. It has not been
     moved; it has been deleted. Do not reintroduce it: rating markup
     returns when there are real reviews to aggregate, sourced from the
     API, never typed in. */
  return (
    <>
      <BanCheck>
        {/* FIXED GRADIENT BACKGROUND - Static on screen, doesn't scroll */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 w-full h-screen"
            style={{
              background: 'linear-gradient(to bottom, #000000 0%, #000000 48%, #010101 52%, #020202 56%, #030303 60%, #040404 64%, #050505 68%, #060606 72%, #070707 76%, #080808 80%, #090909 84%, #0a0a0a 88%, #0c0c0c 92%, #0e0e0e 96%, #101010 100%)',
              willChange: 'transform'
            }}
          />
        </div>

        {/* CONTENT LAYER - All sections sit above the fixed gradient */}
        <div className="relative z-10 min-h-screen flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black overflow-x-hidden">
          
          {/* SEO: H1 for homepage - hidden but present for SEO */}
          <h1 className="sr-only">Buy and Sell Used Panties - PantyPost Marketplace</h1>
          
          {/* Hero Section - CRITICAL: Above the fold, no lazy loading */}
          <SectionWrapper sectionName="Hero" fallbackHeight="h-screen">
            <HeroSection />
          </SectionWrapper>
          
          {/* Trust Signals Section - CRITICAL: Above the fold on desktop */}
          <SectionWrapper sectionName="Trust Signals" fallbackHeight="h-64">
            <TrustSignalsSection />
          </SectionWrapper>
          
          {/* Featured Random Listings Section - LAZY LOADED */}
          <SectionWrapper sectionName="Featured Listings" fallbackHeight="h-96">
            <FeaturedRandom />
          </SectionWrapper>
          
          {/* Features Section - LAZY LOADED */}
          <SectionWrapper sectionName="Features" fallbackHeight="h-96">
            <FeaturesSection />
          </SectionWrapper>

          {/* FAQ Section - LAZY LOADED */}
          <SectionWrapper sectionName="FAQ" fallbackHeight="h-80">
            <FAQSection />
          </SectionWrapper>

          {/* CTA Section - NO lazy loading (simple, small) */}
          <SectionWrapper sectionName="Call to Action" fallbackHeight="h-80">
            <CTASection />
          </SectionWrapper>
          
          {/* Footer - NO lazy loading (simple, small) */}
          <SectionWrapper sectionName="Footer" fallbackHeight="h-64">
            <Footer />
          </SectionWrapper>
        </div>

        {/* Enhanced Global Styles with better performance optimizations */}
        <style jsx global>{`
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-slow { 
            animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
            will-change: opacity;
          }

          /* Enhanced shimmer effect for loading states */
          .loading-shimmer {
            position: relative;
            overflow: hidden;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: shimmer 1.5s infinite;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          /* Perspective for 3D-ish hover with GPU acceleration */
          .perspective { 
            perspective: 1000px; 
            transform-style: preserve-3d;
          }

          /* Enhanced Smooth Scroll with performance optimization */
          html { 
            scroll-behavior: smooth; 
            -webkit-overflow-scrolling: touch;
          }

          /* Enhanced Focus Visible with better contrast and accessibility */
          *:focus-visible {
            outline: 2px solid #ff950e;
            outline-offset: 2px;
            border-radius: 4px;
            box-shadow: 
              0 0 0 4px rgba(255, 149, 14, 0.1),
              0 0 0 2px rgba(255, 149, 14, 0.3);
            transition: box-shadow 0.2s ease;
          }
          *:focus:not(:focus-visible) {
            outline: none;
          }
          button:focus-visible, a:focus-visible {
            transform: scale(1.02);
            transition: transform 0.1s ease, box-shadow 0.2s ease;
          }

          /* Enhanced Custom Spin Animations with GPU acceleration */
          @keyframes spin-slow {
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow { 
            animation: spin-slow 25s linear infinite; 
            will-change: transform;
            transform-origin: center;
          }

          @keyframes spin-slow-reverse {
            to { transform: rotate(-360deg); }
          }
          .animate-spin-slow-reverse { 
            animation: spin-slow-reverse 20s linear infinite; 
            will-change: transform;
            transform-origin: center;
          }

          @keyframes spin-medium {
            to { transform: rotate(360deg); }
          }
          .animate-spin-medium { 
            animation: spin-medium 35s linear infinite; 
            will-change: transform;
            transform-origin: center;
          }

          @keyframes spin-medium-reverse {
            to { transform: rotate(-360deg); }
          }
          .animate-spin-medium-reverse { 
            animation: spin-medium-reverse 30s linear infinite; 
            will-change: transform;
            transform-origin: center;
          }

          /* Enhanced Tailwind Arbitrary Radial Gradient with fallback */
          .bg-gradient-radial {
            background-image: radial-gradient(circle, var(--tw-gradient-stops));
            background-image: -webkit-radial-gradient(circle, var(--tw-gradient-stops));
          }

          /* Performance optimizations */
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Enhanced reduced motion handling for accessibility */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
            
            .animate-spin-slow,
            .animate-spin-slow-reverse,
            .animate-spin-medium,
            .animate-spin-medium-reverse,
            .animate-pulse-slow,
            .loading-shimmer {
              animation: none !important;
            }
            
            .perspective {
              perspective: none !important;
            }
          }

          /* Enhanced loading skeleton animations */
          @keyframes skeleton-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .animate-skeleton {
            animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            will-change: opacity;
          }
          
          /* Stagger delays for skeleton animations */
          .animate-pulse.delay-75 {
            animation-delay: 75ms;
          }
          .animate-pulse.delay-150 {
            animation-delay: 150ms;
          }
          .animate-pulse.delay-300 {
            animation-delay: 300ms;
          }

          /* Enhanced error state styles */
          .error-state {
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(127, 29, 29, 0.05));
            border: 1px solid rgba(220, 38, 38, 0.2);
          }
          
          .error-state:hover {
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(127, 29, 29, 0.08));
            border-color: rgba(220, 38, 38, 0.3);
          }
        `}</style>
      </BanCheck>
    </>
  );
}


