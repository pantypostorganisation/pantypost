'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Star,
  TrendingUp,
  Shield,
  CreditCard,
  CheckCircle,
  HelpCircle,
  Lock,
  Users,
} from 'lucide-react';

export default function Home() {
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified');
    if (!verified) {
      setShowAgeVerification(true);
    }
  }, []);

  const handleAgeVerification = (isAdult: boolean) => {
    if (isAdult) {
      localStorage.setItem('ageVerified', 'true');
      setShowAgeVerification(false);
    } else {
      alert('You must be 21 or older to enter.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black">
      {/* Age Verification Modal */}
      {showAgeVerification && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in-fast">
          <div className="bg-[#161616] border-2 border-[#ff950e]/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-[#ff950e]/10">
            <h2 className="text-2xl font-bold text-[#ff950e] mb-4 text-center">Age Verification</h2>
            <p className="mb-6 text-center text-gray-300">
              You must be at least 21 years old to enter this site. By entering, you confirm you are at least 21 years old.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleAgeVerification(true)}
                className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-bold rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span className="relative z-10">I am 21+</span>
              </button>
              <button
                onClick={() => handleAgeVerification(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative w-full pt-10 pb-16 md:pt-12 md:pb-20 bg-gradient-to-b from-black via-[#080808] to-[#101010] overflow-hidden">
        {/* Subtle Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between min-h-[70vh] md:min-h-[75vh] z-10">
          {/* LEFT: Info/CTA */}
          <div className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] flex flex-col items-center md:items-start text-center md:text-left justify-center z-20">
            <div className="flex items-center mb-3 gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CheckCircle className="h-5 w-5 text-[#ff950e] animate-pulse-slow" />
              <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase">
                Trusted by 10,000+ users
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              The <span className="text-[#ff950e]">Ultimate</span> Marketplace
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl font-medium animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Connect discreetly with verified sellers offering premium personal items. The safe, anonymous way to buy and sell worn undergarments online.
            </p>
            <div className="flex gap-4 mb-8 flex-col sm:flex-row w-full md:w-auto justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/browse"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-2.5 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ color: '#000' }} // Ensure text color override
              >
                <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[-2px]" />
                <span className="relative z-10">Browse Listings</span>
              </Link>
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-2.5 bg-black border border-[#ff950e]/60 text-[#ff950e] font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-[#111] hover:border-[#ff950e] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[-2px]" />
                Start Selling
              </Link>
            </div>
            {/* Trust Badges */}
            <div className="flex gap-2.5 mt-6 flex-wrap justify-center md:justify-start animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {[
                { icon: Shield, text: 'Secure & Private' },
                { icon: Star, text: 'Verified Sellers' },
                { icon: CreditCard, text: 'Safe Payments' },
                { icon: Lock, text: 'Encrypted' },
              ].map((badge, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md"
                >
                  <badge.icon className="w-3.5 h-3.5 text-[#ff950e]" /> {badge.text}
                </span>
              ))}
            </div>
          </div>
          {/* RIGHT: Phone Image */}
          {/* Increased height (~1.5x) and kept increased right padding */}
          <div className="w-full md:w-1/2 lg:w-[50%] xl:w-[50%] flex justify-center md:justify-end items-center h-full mt-12 md:mt-0 z-10 perspective pr-0 md:pr-12 lg:pr-20 xl:pr-24">
            <img
              src="/phone-mockup.png"
              alt="App on phone"
              // Increased height classes to ~1.5x of previous values
              className="h-[200px] sm:h-60 md:h-72 lg:h-80 w-auto transform transition-transform duration-500 hover:scale-105 hover:rotate-3 animate-fade-in-slow"
              style={{
                background: 'none',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                objectFit: 'contain',
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))',
                padding: 0,
                margin: 0,
              }}
            />
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <div className="bg-[#101010] py-16 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, title: 'Privacy First', desc: 'Your identity is always protected.' },
              { icon: CreditCard, title: 'Secure Payments', desc: 'Encrypted and safe transactions.' },
              { icon: Star, title: 'Verified Sellers', desc: 'Manually reviewed for authenticity.' },
              { icon: Users, title: '24/7 Support', desc: 'Our team is here to help anytime.' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: `${0.1 * (index + 1)}s` }}>
                <item.icon className="h-7 w-7 text-[#ff950e] mb-3 transition-transform duration-300 hover:scale-110" />
                <span className="text-white font-medium text-sm">{item.title}</span>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* Features Section */}
       <div className="bg-black py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white mb-16 tracking-tight animate-fade-in-up">
            How <span className="text-[#ff950e]">PantyPost</span> Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShoppingBag, title: 'Browse Listings', desc: "Explore our curated selection of premium items from verified sellers. Find exactly what you're looking for." },
              { icon: Heart, title: 'Subscribe to Sellers', desc: 'Get exclusive access to premium content from your favorite sellers with monthly subscriptions.' },
              { icon: TrendingUp, title: 'Sell Your Items', desc: 'Create your seller profile, list your items, and start earning. Our platform handles payments securely.' },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-[#131313] rounded-xl p-6 transition-all duration-300 border border-white/10 hover:border-[#ff950e]/50 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff950e]/10 animate-fade-in-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-full flex items-center justify-center mb-5 border border-[#ff950e]/20">
                  <feature.icon className="h-6 w-6 text-[#ff950e]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-[#101010] to-black py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight animate-fade-in-up">Ready to Get Started?</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Join thousands of buyers and sellers on the most secure marketplace for used undergarments.
          </p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             <Link
                href="/login"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-semibold text-base transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ color: '#000' }}
              >
              <TrendingUp className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
              <span className="relative z-10">Create Account</span>
            </Link>
            <Link
              href="/browse"
              className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 bg-black border border-[#ff950e]/60 text-[#ff950e] font-semibold text-base transition-all duration-300 ease-out hover:scale-105 hover:bg-[#111] hover:border-[#ff950e] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <ShoppingBag className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
              Explore Listings
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#050505] py-12 mt-auto border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h2 className="text-xl font-bold text-[#ff950e]">PantyPost</h2>
              <p className="text-gray-500 text-sm mt-1">The premium marketplace for authentic items</p>
            </div>
            <div className="flex gap-6 md:gap-8">
              <Link href="/terms" className="text-gray-400 hover:text-[#ff950e] text-sm transition-colors duration-200">Terms</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-[#ff950e] text-sm transition-colors duration-200">Privacy</Link>
              <Link href="/help" className="text-gray-400 hover:text-[#ff950e] text-sm transition-colors duration-200">Help</Link>
              <Link href="/contact" className="text-gray-400 hover:text-[#ff950e] text-sm transition-colors duration-200">Contact</Link>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} PantyPost. All rights reserved.
              <span className="block mt-2 text-xs text-gray-600">
                Disclaimer: PantyPost is committed to user safety and privacy. All users must be 21+ and comply with our terms.
              </span>
            </p>
            <div className="mt-4">
              <Link
                href="/help"
                className="inline-flex items-center gap-2 text-[#ff950e] hover:underline text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] rounded"
              >
                <HelpCircle className="h-4 w-4" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Styles & Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          50% { opacity: 0.7; }
        }

        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-fade-in-fast { animation: fadeIn 0.3s ease-out forwards; opacity: 0; }
        .animate-fade-in-slow { animation: fadeIn 1s ease-out forwards; opacity: 0; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
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
        /* Remove default outline when focus-visible is supported */
        *:focus:not(:focus-visible) {
          outline: none;
        }
        /* Specific overrides for buttons if needed */
         button:focus-visible, a:focus-visible {
           /* Use Tailwind rings or custom outline */
         }

        /* Optional: Subtle noise texture */
        /* Ensure you have a noise.png file in your public folder */
        /* .noise-overlay {
           position: absolute;
           inset: 0;
           opacity: 0.03;
           background-image: url('/noise.png');
           background-repeat: repeat;
           pointer-events: none;
           z-index: 0;
         } */

      `}</style>
    </div>
  );
}
