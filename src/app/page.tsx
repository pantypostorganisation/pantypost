// src/app/page.tsx
'use client';

import BanCheck from '@/components/BanCheck';
import HeroSection from '@/components/homepage/HeroSection';
import TrustSignalsSection from '@/components/homepage/TrustSignalsSection';
import FeaturesSection from '@/components/homepage/FeaturesSection';
import CTASection from '@/components/homepage/CTASection';
import Footer from '@/components/homepage/Footer';

export default function Home() {
  return (
    <BanCheck>
      <div className="min-h-screen bg-black flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black overflow-x-hidden">
        <HeroSection />
        <TrustSignalsSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
        
        {/* Global Styles - keeping the exact same styles from your original */}
        <style jsx global>{`
          @keyframes pulse-slow {
            50% { opacity: 0.7; }
          }
          .animate-pulse-slow { animation: pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

          /* Perspective for 3D-ish hover */
          .perspective { perspective: 1000px; }

          /* Smooth Scroll */
          html { scroll-behavior: smooth; }

          /* Custom Focus Visible */
          *:focus-visible {
            outline: 2px solid #ff950e;
            outline-offset: 2px;
            border-radius: 4px; /* Optional: match button radius */
          }
          *:focus:not(:focus-visible) {
            outline: none;
          }
           button:focus-visible, a:focus-visible {
             /* Tailwind rings are applied via focus-visible:ring-* */
           }

          /* Custom Spin Animations for Shapes */
          @keyframes spin-slow {
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow { animation: spin-slow 25s linear infinite; }

          @keyframes spin-slow-reverse {
            to { transform: rotate(-360deg); }
          }
          .animate-spin-slow-reverse { animation: spin-slow-reverse 20s linear infinite; }

           @keyframes spin-medium {
            to { transform: rotate(360deg); }
          }
          .animate-spin-medium { animation: spin-medium 35s linear infinite; }

          @keyframes spin-medium-reverse {
            to { transform: rotate(-360deg); }
          }
          .animate-spin-medium-reverse { animation: spin-medium-reverse 30s linear infinite; }

          /* Tailwind Arbitrary Radial Gradient */
          .bg-gradient-radial {
              background-image: radial-gradient(circle, var(--tw-gradient-stops));
          }

        `}</style>
      </div>
    </BanCheck>
  );
}
