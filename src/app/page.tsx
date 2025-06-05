// src/app/page.tsx
'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BanCheck from '@/components/BanCheck';
import HeroSection from '@/components/homepage/HeroSection';
import TrustSignalsSection from '@/components/homepage/TrustSignalsSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import CTASection from '@/components/homepage/CTASection';
import Footer from '@/components/homepage/Footer';

// Loading fallback components
const SectionSkeleton = ({ height = "h-96" }: { height?: string }) => (
  <div className={`${height} bg-gradient-to-b from-[#101010] to-black flex items-center justify-center`}>
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// Enhanced error fallback for sections
const SectionErrorFallback = ({ sectionName }: { sectionName: string }) => (
  <div className="min-h-[200px] bg-gradient-to-b from-[#101010] to-black flex items-center justify-center">
    <div className="text-center p-8">
      <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-400 text-xl">⚠</span>
      </div>
      <h3 className="text-red-400 font-semibold mb-2">Section Unavailable</h3>
      <p className="text-gray-500 text-sm">The {sectionName} section could not be loaded.</p>
    </div>
  </div>
);

export default function Home() {
  return (
    <BanCheck>
      <div className="min-h-screen bg-black flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black overflow-x-hidden">
        
        {/* Hero Section with Error Boundary */}
        <ErrorBoundary fallback={<SectionErrorFallback sectionName="Hero" />}>
          <Suspense fallback={<SectionSkeleton height="h-screen" />}>
            <HeroSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Trust Signals Section with Error Boundary */}
        <ErrorBoundary fallback={<SectionErrorFallback sectionName="Trust Signals" />}>
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <TrustSignalsSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Features Section with Error Boundary */}
        <ErrorBoundary fallback={<SectionErrorFallback sectionName="Features" />}>
          <Suspense fallback={<SectionSkeleton height="h-96" />}>
            <FeaturesSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* CTA Section with Error Boundary */}
        <ErrorBoundary fallback={<SectionErrorFallback sectionName="Call to Action" />}>
          <Suspense fallback={<SectionSkeleton height="h-80" />}>
            <CTASection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Footer with Error Boundary */}
        <ErrorBoundary fallback={<SectionErrorFallback sectionName="Footer" />}>
          <Suspense fallback={<SectionSkeleton height="h-64" />}>
            <Footer />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Global Styles - Enhanced with performance optimizations */}
      <style jsx global>{`
        @keyframes pulse-slow {
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { 
          animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; 
          will-change: opacity;
        }

        /* Perspective for 3D-ish hover */
        .perspective { 
          perspective: 1000px; 
        }

        /* Smooth Scroll with performance optimization */
        html { 
          scroll-behavior: smooth; 
          -webkit-overflow-scrolling: touch;
        }

        /* Enhanced Focus Visible with better contrast */
        *:focus-visible {
          outline: 2px solid #ff950e;
          outline-offset: 2px;
          border-radius: 4px;
          box-shadow: 0 0 0 4px rgba(255, 149, 14, 0.1);
        }
        *:focus:not(:focus-visible) {
          outline: none;
        }
        button:focus-visible, a:focus-visible {
          transform: scale(1.02);
          transition: transform 0.1s ease;
        }

        /* Enhanced Custom Spin Animations with GPU acceleration */
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { 
          animation: spin-slow 25s linear infinite; 
          will-change: transform;
        }

        @keyframes spin-slow-reverse {
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow-reverse { 
          animation: spin-slow-reverse 20s linear infinite; 
          will-change: transform;
        }

        @keyframes spin-medium {
          to { transform: rotate(360deg); }
        }
        .animate-spin-medium { 
          animation: spin-medium 35s linear infinite; 
          will-change: transform;
        }

        @keyframes spin-medium-reverse {
          to { transform: rotate(-360deg); }
        }
        .animate-spin-medium-reverse { 
          animation: spin-medium-reverse 30s linear infinite; 
          will-change: transform;
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
        
        /* Reduce motion for accessibility */
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
          .animate-pulse-slow {
            animation: none !important;
          }
        }

        /* Enhanced loading states */
        .loading-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </BanCheck>
  );
}
