'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
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
import { motion, useScroll, useTransform } from 'framer-motion';

// Define animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeInFastVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// Variant for the glowing shapes
const shapeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] }
    }
};

// Floating animation for particles
const floatVariants = {
  initial: { y: 100, opacity: 0 },
  animate: {
    y: -100,
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Generate particle positions (deterministic based on index)
const particlePositions = Array.from({ length: 15 }, (_, i) => ({
  left: ((i * 37) % 90) + 5, // Creates pseudo-random horizontal distribution
  top: ((i * 23) % 100), // Creates pseudo-random vertical distribution
  delay: (i * 0.3) % 4, // Stagger the animations
  duration: 8 + (i % 4) // Vary duration between 8-11 seconds
}));

export default function Home() {
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  // Adjusted parallax: Start higher ('-5%') and move less ('20%')
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '20%']);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const verified = localStorage.getItem('ageVerified');
        if (!verified) {
          setShowAgeVerification(true);
        }
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
    <div className="min-h-screen bg-black flex flex-col font-sans text-white selection:bg-[#ff950e] selection:text-black overflow-x-hidden">
      {/* Age Verification Modal */}
      {showAgeVerification && (
        <motion.div
          className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          variants={fadeInFastVariants}
        >
          <motion.div
            className="bg-[#161616] border-2 border-[#ff950e]/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-[#ff950e]/10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
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
          </motion.div>
        </motion.div>
      )}

      {/* Hero Section */}
      {/* Stays the same: Ends in #101010 */}
      <section ref={heroRef} className="relative w-full pt-10 pb-8 md:pt-12 md:pb-12 bg-gradient-to-b from-black via-[#080808] to-[#101010] overflow-hidden z-10">
        {/* Subtle Noise Overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particlePositions.map((particle, i) => (
            <motion.div
              key={i}
              className={`absolute bg-[#ff950e]/20 rounded-full ${
                i % 3 === 0 ? 'w-1.5 h-1.5' : i % 3 === 1 ? 'w-1 h-1' : 'w-2 h-2'
              }`}
              style={{ 
                left: `${particle.left}%`,
                top: `${particle.top}%` 
              }}
              variants={floatVariants}
              initial="initial"
              animate="animate"
              transition={{ 
                delay: particle.delay,
                duration: particle.duration
              }}
            />
          ))}
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between min-h-[70vh] md:min-h-[75vh] z-10">
          {/* LEFT: Info/CTA */}
          <motion.div
            className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] flex flex-col items-center md:items-start text-center md:text-left justify-center z-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div className="flex items-center mb-3 gap-2" variants={itemVariants}>
              <CheckCircle className="h-5 w-5 text-[#ff950e] animate-pulse-slow" />
              <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase">
                Trusted by 10,000+ users
              </span>
            </motion.div>
            <motion.h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter" variants={itemVariants}>
              The <span className="text-[#ff950e]">Ultimate</span> Marketplace
            </motion.h1>
            <motion.p className="text-gray-400 text-base md:text-lg mb-8 max-w-xl font-medium" variants={itemVariants}>
              Connect discreetly with verified sellers offering premium personal items. The safe, anonymous way to buy and sell worn undergarments online.
            </motion.p>
            <motion.div className="flex gap-4 mb-8 flex-col sm:flex-row w-full md:w-auto justify-center md:justify-start" variants={itemVariants}>
              <Link
                href="/browse"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-2.5 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ color: '#000' }}
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
            </motion.div>
            {/* Trust Badges */}
            <motion.div className="flex gap-2.5 mt-6 flex-wrap justify-center md:justify-start" variants={containerVariants}>
              {[
                { icon: Shield, text: 'Secure & Private' },
                { icon: Star, text: 'Verified Sellers' },
                { icon: CreditCard, text: 'Safe Payments' },
                { icon: Lock, text: 'Encrypted' },
              ].map((badge, index) => (
                <motion.span
                  key={index}
                  className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md"
                  variants={itemVariants}
                >
                  <badge.icon className="w-3.5 h-3.5 text-[#ff950e]" /> {badge.text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
          {/* RIGHT: Phone Image */}
          <motion.div
            className="w-full md:w-1/2 lg:w-[50%] xl:w-[50%] flex justify-center md:justify-end items-center h-full mt-8 md:mt-0 z-10 perspective pr-0 md:pr-12 lg:pr-20 xl:pr-24" // Reduced mt-12 to mt-8
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeInVariants}
            style={{ y }} // Use adjusted parallax transform
          >
            {/* Increased height classes */}
            <img
              src="/phone-mockup.png"
              alt="App on phone"
              className="h-[280px] sm:h-96 md:h-[440px] lg:h-[520px] w-auto transform transition-transform duration-500 hover:scale-105 hover:rotate-3" // Increased heights again
              style={{
                background: 'none', border: 'none', borderRadius: 0, boxShadow: 'none', objectFit: 'contain',
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))',
                padding: 0, margin: 0,
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Trust Signals Section */}
      {/* Starts from #101010 (Hero end) and blends to black (Features start) */}
      <div className="bg-gradient-to-b from-[#101010] to-black pt-8 md:pt-12 pb-16 md:pb-20 relative z-20 overflow-hidden">
        {/* Shape Divider 1 (Background Glow) */}
        <motion.div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[150%] md:w-[100%] lg:w-[80%] h-80 pointer-events-none z-0"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={shapeVariants}
        >
            <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/15 via-[#ff950e]/5 to-transparent blur-3xl rounded-[50%_30%_70%_40%/60%_40%_60%_50%] animate-spin-slow-reverse"></div>
        </motion.div>

        {/* Content container */}
        <motion.div
          className="relative max-w-5xl mx-auto px-6 md:px-8 z-10"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={containerVariants}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, title: 'Privacy First', desc: 'Your identity is always protected.' },
              { icon: CreditCard, title: 'Secure Payments', desc: 'Encrypted and safe transactions.' },
              { icon: Star, title: 'Verified Sellers', desc: 'Manually reviewed for authenticity.' },
              { icon: Users, title: '24/7 Support', desc: 'Our team is here to help anytime.' },
            ].map((item, index) => (
              <motion.div key={index} className="flex flex-col items-center" variants={itemVariants}>
                <item.icon className="h-7 w-7 text-[#ff950e] mb-3 transition-transform duration-300 hover:scale-110" />
                <span className="text-white font-medium text-sm">{item.title}</span>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

       {/* Features Section */}
       {/* Starts from black (Trust Signals end) and blends to #101010 (CTA start) */}
       <div className="bg-gradient-to-b from-black to-[#101010] pt-16 pb-16 md:pt-20 md:pb-20 relative z-30 overflow-hidden">
        {/* Content container */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white mb-16 tracking-tight"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={itemVariants}
          >
            How <span className="text-[#ff950e]">PantyPost</span> Works
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={containerVariants}
          >
            {[
              { icon: ShoppingBag, title: 'Browse Listings', desc: "Explore our curated selection of premium items from verified sellers. Find exactly what you're looking for." },
              { icon: Heart, title: 'Subscribe to Sellers', desc: 'Get exclusive access to premium content from your favorite sellers with monthly subscriptions.' },
              { icon: TrendingUp, title: 'Sell Your Items', desc: 'Create your seller profile, list your items, and start earning. Our platform handles payments securely.' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group relative bg-[#131313] rounded-xl p-6 transition-all duration-300 border border-white/10 hover:border-[#ff950e]/50 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff950e]/10"
                variants={itemVariants}
                whileHover={{ y: -8 }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>
                
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-full flex items-center justify-center mb-5 border border-[#ff950e]/20">
                    <feature.icon className="h-6 w-6 text-[#ff950e]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
         {/* Shape Divider 2 (Background Glow) */}
         <motion.div
            className="absolute -bottom-48 right-[-20%] md:right-[-10%] w-[120%] md:w-[80%] h-96 pointer-events-none z-0"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={shapeVariants}
        >
            <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/10 via-transparent to-transparent blur-3xl rounded-[70%_30%_40%_60%/50%_60%_40%_50%] animate-spin-slow"></div>
        </motion.div>
      </div>

      {/* CTA Section */}
      {/* Stays the same: Starts from #101010 (Features end) and blends to black (Footer start) */}
      <div className="bg-gradient-to-b from-[#101010] to-black pt-16 pb-16 md:pt-20 md:pb-20 relative z-40 overflow-hidden">
         {/* Shape Divider 3 (Background Glow) */}
         <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] md:w-[70%] h-[500px] pointer-events-none z-0"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={shapeVariants}
        >
            <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/10 via-[#ff950e]/5 to-transparent blur-3xl rounded-[40%_60%_60%_40%/70%_50%_50%_30%] animate-spin-medium-reverse"></div>
        </motion.div>

        {/* Content container */}
        <motion.div
          className="relative max-w-3xl mx-auto px-6 md:px-12 text-center z-10"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={containerVariants}
        >
          <motion.h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight" variants={itemVariants}>Ready to Get Started?</motion.h2>
          <motion.p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10" variants={itemVariants}>
            Join thousands of buyers and sellers on the most secure marketplace for used undergarments.
          </motion.p>
          <motion.div className="flex gap-4 justify-center flex-col sm:flex-row" variants={itemVariants}>
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
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      {/* Starts from black (CTA end) and blends to #050505 */}
      <footer className="bg-gradient-to-b from-black to-[#050505] pt-16 pb-12 relative z-50 overflow-hidden">
         {/* Shape Divider 4 (Background Glow) */}
         <motion.div
            className="absolute -top-52 left-[-15%] md:left-[-5%] w-[130%] md:w-[80%] h-96 pointer-events-none z-0"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={shapeVariants}
        >
            <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/5 via-transparent to-transparent blur-3xl rounded-[30%_70%_50%_50%/60%_40%_70%_40%] animate-spin-medium"></div>
        </motion.div>

        {/* Content container */}
        <div className="relative max-w-7xl mx-auto px-6 md:px-8 z-10">
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

      {/* Global Styles */}
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
  );
}
