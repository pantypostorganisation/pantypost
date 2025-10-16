// src/app/page.tsx
'use client';

import { Suspense, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BanCheck from '@/components/BanCheck';
import HeroSection from '@/components/homepage/HeroSection';
import TrustSignalsSection from '@/components/homepage/TrustSignalsSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import CTASection from '@/components/homepage/CTASection';
import Footer from '@/components/homepage/Footer';
import FeaturedRandom from '@/components/homepage/FeaturedRandom';
import FAQSection from '@/components/homepage/FAQSection';
import Head from 'next/head';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

// Enhanced loading fallback components with pulse animations
const SectionSkeleton = ({ height = "h-96" }: { height?: string }) => (
  <div className={`${height} flex items-center justify-center`}>
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-800/50 rounded w-32 mx-auto animate-pulse"></div>
        <div className="h-3 bg-gray-800/30 rounded w-24 mx-auto animate-pulse delay-75"></div>
      </div>
    </div>
  </div>
);

// Enhanced error fallback with retry functionality
const SectionErrorFallback = ({ 
  sectionName, 
  retry, 
  error 
}: { 
  sectionName: string; 
  retry?: () => void; 
  error?: Error; 
}) => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="text-center p-8 max-w-md mx-auto">
      <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-400 text-xl">⚠</span>
      </div>
      <h3 className="text-red-400 font-semibold mb-2">Section Unavailable</h3>
      <p className="text-gray-500 text-sm mb-4">
        The {sectionName} section could not be loaded.
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="text-gray-600 text-xs mb-4 font-mono bg-gray-900/50 p-2 rounded">
          {error.message}
        </p>
      )}
      {retry && (
        <button 
          onClick={retry} 
          className="text-[#ff950e] text-sm hover:underline hover:text-[#ff6b00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Enhanced section wrapper with retry functionality
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
        <SectionErrorFallback 
          sectionName={sectionName} 
          retry={handleRetry}
        />
      }
    >
      <Suspense fallback={<SectionSkeleton height={fallbackHeight} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default function Home() {
  return (
    <>
      {/* SEO: Structured Data for Homepage */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Panty Post - Buy & Sell Used Panties Marketplace',
              description: 'Discreet marketplace to buy and sell used panties with verified sellers and secure payments',
              url: BASE_URL,
              mainEntity: {
                '@type': 'OnlineMarketplace',
                name: 'PantyPost',
                description: 'Anonymous marketplace for buying and selling used panties',
                url: BASE_URL,
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.8',
                  reviewCount: '10000',
                  bestRating: '5',
                  worstRating: '1'
                },
                potentialAction: [
                  {
                    '@type': 'BuyAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${BASE_URL}/browse`,
                      actionPlatform: [
                        'http://schema.org/DesktopWebPlatform',
                        'http://schema.org/MobileWebPlatform'
                      ]
                    }
                  },
                  {
                    '@type': 'SellAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${BASE_URL}/login`,
                      actionPlatform: [
                        'http://schema.org/DesktopWebPlatform',
                        'http://schema.org/MobileWebPlatform'
                      ]
                    }
                  }
                ]
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is PantyPost and how does it work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'PantyPost (also known as Panty Post) is a discreet marketplace that connects verified sellers with qualified buyers of used panties. Users can create an account, browse curated listings, and checkout securely with anonymous transactions.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Is PantyPost the same as Panty Post?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes. PantyPost and Panty Post refer to the same privacy-first brand and marketplace for adult panty trading experiences.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'How does PantyPost keep buyers and sellers safe?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'PantyPost protects its community with ID verification, automated moderation, and secure escrow-style payments that keep every transaction anonymous and compliant.'
                  }
                }
              ]
            })
          }}
        />
      </Head>

      <BanCheck>
        {/* FIXED GRADIENT BACKGROUND - Smooth wavy gradient flowing through entire page */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-x-0 top-0 w-full h-[5000px] bg-gradient-to-b from-black via-[#080808] via-[#101010] via-black via-[#080808] via-[#101010] via-black via-[#080808] via-[#101010] via-black to-[#080808]"
            style={{
              backgroundSize: '100% 100%'
            }}
          />
        </div>

        {/* CONTENT LAYER - All sections sit above the fixed gradient */}
        <div className="relative z-10 min-h-screen flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black overflow-x-hidden">
          
          {/* SEO: H1 for homepage - hidden but present for SEO */}
          <h1 className="sr-only">Buy and Sell Used Panties - PantyPost Marketplace</h1>
          
          {/* Hero Section with Error Boundary */}
          <SectionWrapper sectionName="Hero" fallbackHeight="h-screen">
            <HeroSection />
          </SectionWrapper>
          
          {/* Trust Signals Section with Error Boundary */}
          <SectionWrapper sectionName="Trust Signals" fallbackHeight="h-64">
            <TrustSignalsSection />
          </SectionWrapper>
          
          {/* Featured Random Listings Section */}
          <SectionWrapper sectionName="Featured Listings" fallbackHeight="h-96">
            <FeaturedRandom />
          </SectionWrapper>
          
          {/* Features Section with Error Boundary */}
          <SectionWrapper sectionName="Features" fallbackHeight="h-96">
            <FeaturesSection />
          </SectionWrapper>

          {/* FAQ Section with SEO-focused brand reinforcement */}
          <SectionWrapper sectionName="FAQ" fallbackHeight="h-80">
            <FAQSection />
          </SectionWrapper>

          {/* CTA Section with Error Boundary */}
          <SectionWrapper sectionName="Call to Action" fallbackHeight="h-80">
            <CTASection />
          </SectionWrapper>
          
          {/* Footer with Error Boundary */}
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
