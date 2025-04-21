'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, Star, TrendingUp, Shield, CreditCard } from 'lucide-react';

export default function Home() {
  const [showAgeVerification, setShowAgeVerification] = useState(false);

  useEffect(() => {
    // Check if user has already verified age
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
      window.location.href = 'https://www.google.com';
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Age Verification Modal */}
      {showAgeVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] text-white p-8 rounded-lg max-w-md w-full border border-[#ff950e]">
            <h2 className="text-2xl font-bold text-[#ff950e] mb-4 text-center">Age Verification</h2>
            <p className="mb-6 text-center">
              You must be at least 21 years old to enter this site. By entering, you confirm you are at least 21 years old.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleAgeVerification(true)}
                className="bg-[#ff950e] hover:bg-[#e0850d] text-white font-bold py-3 px-6 rounded-full transition"
              >
                I am 21+
              </button>
              <button
                onClick={() => handleAgeVerification(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-transparent opacity-70"></div>
        <div className="absolute inset-0 z-0" style={{ 
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(3px) brightness(0.3)',
        }}></div>
        
        <div className="container mx-auto px-6 md:px-12 z-10 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            <span className="inline-block">The Ultimate </span>
            <span className="inline-block text-[#ff950e]">Marketplace</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-3xl mb-12 leading-relaxed">
            Connect discreetly with verified sellers offering premium personal items. The safe, anonymous way to buy and sell worn undergarments online.
          </p>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <Link 
              href="/browse" 
              className="rounded-full bg-[#ff950e] hover:bg-[#e0850d] text-white font-medium text-base sm:text-lg py-4 px-8 transition flex items-center justify-center"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Listings
            </Link>
            <Link 
              href="/login" 
              className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white font-medium text-base sm:text-lg py-4 px-8 transition flex items-center justify-center"
            >
              Start Selling
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center mt-12 gap-4 md:gap-8">
            <div className="flex items-center text-gray-400">
              <Shield className="h-5 w-5 mr-2 text-[#ff950e]" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center text-gray-400">
              <CreditCard className="h-5 w-5 mr-2 text-[#ff950e]" />
              <span>Safe Payments</span>
            </div>
            <div className="flex items-center text-gray-400">
              <Star className="h-5 w-5 mr-2 text-[#ff950e]" />
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#121212] py-20">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            How <span className="text-[#ff950e]">PantyPost</span> Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-[#ff950e]/20 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-[#ff950e]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Browse Listings</h3>
              <p className="text-gray-400">
                Explore our curated selection of premium items from verified sellers. Find exactly what you're looking for.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-[#ff950e]/20 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-[#ff950e]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Subscribe to Sellers</h3>
              <p className="text-gray-400">
                Get exclusive access to premium content from your favorite sellers with monthly subscriptions.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 hover:transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-[#ff950e]/20 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#ff950e]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Sell Your Items</h3>
              <p className="text-gray-400">
                Create your seller profile, list your items, and start earning. Our platform handles payments securely.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-black py-20">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Join thousands of buyers and sellers on the most secure marketplace for used undergarments.
          </p>
          
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Link 
              href="/login" 
              className="rounded-full bg-[#ff950e] hover:bg-[#e0850d] text-white font-medium py-3 px-8 transition"
            >
              Create Account
            </Link>
            <Link 
              href="/browse" 
              className="rounded-full bg-transparent hover:bg-white/10 border border-[#ff950e] text-[#ff950e] font-medium py-3 px-8 transition"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-[#0a0a0a] py-10 mt-auto">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold text-[#ff950e]">PantyPost</h2>
              <p className="text-gray-500 text-sm mt-1">The premium marketplace for authentic items</p>
            </div>
            
            <div className="flex gap-8">
              <Link href="/terms" className="text-gray-400 hover:text-[#ff950e] text-sm">Terms</Link>
              <Link href="/privacy" className="text-gray-400 hover:text-[#ff950e] text-sm">Privacy</Link>
              <Link href="/help" className="text-gray-400 hover:text-[#ff950e] text-sm">Help</Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} PantyPost. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}