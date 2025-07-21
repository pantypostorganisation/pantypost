// src/components/buyers/messages/EmptyState.tsx
'use client';

import React from 'react';
import { MessageSquare, ArrowRight, Sparkles, Shield, Star, Heart } from 'lucide-react';
import Link from 'next/link';

export default function EmptyState() {
  const [messageCount, setMessageCount] = React.useState(0);
  const [showCounter, setShowCounter] = React.useState(false);

  React.useEffect(() => {
    const animateCounter = () => {
      // Show counter
      setShowCounter(true);
      setMessageCount(0);
      
      // Count up animation
      let count = 0;
      const countInterval = setInterval(() => {
        count++;
        setMessageCount(count);
        
        if (count >= 5) {
          clearInterval(countInterval);
          
          // Hide counter after a brief pause
          setTimeout(() => {
            setShowCounter(false);
            setMessageCount(0);
          }, 1000);
        }
      }, 1000); // 1 second per count

      return () => clearInterval(countInterval);
    };

    // Initial animation after a short delay
    const initialTimeout = setTimeout(animateCounter, 500);

    // Repeat animation every 8 seconds (5 seconds counting + 1 second pause + 2 seconds wait)
    const repeatInterval = setInterval(animateCounter, 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(repeatInterval);
    };
  }, []);

  const tips = [
    {
      icon: <Heart className="w-4 h-4 text-pink-500" />,
      text: "Be respectful and clear in your messages"
    },
    {
      icon: <Sparkles className="w-4 h-4 text-yellow-500" />,
      text: "Use custom requests for specific items"
    },
    {
      icon: <Shield className="w-4 h-4 text-blue-500" />,
      text: "Check seller profiles for verification status"
    },
    {
      icon: <Star className="w-4 h-4 text-purple-500" />,
      text: "Read seller reviews before purchasing"
    }
  ];

  return (
    <div className="flex-1 flex items-center justify-center bg-[#121212] p-8">
      <div className="text-center max-w-md">
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-[#ff950e]/20 to-[#ff950e]/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-br from-[#ff950e]/30 to-[#ff950e]/10 rounded-full flex items-center justify-center relative">
              <MessageSquare className="w-12 h-12 text-[#ff950e]" />
              
              {/* Animated Message Counter - positioned on the icon */}
              <div 
                className={`absolute top-2 right-2 bg-red-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold text-xs shadow-lg transition-all duration-300 ${
                  showCounter 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-0'
                }`}
              >
                {messageCount}
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Start a Conversation
        </h2>
        
        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
          Connect with verified sellers to find exactly what you're looking for. 
          Browse listings and message sellers directly.
        </p>
        
        {/* Enhanced Button */}
        <Link
          href="/browse"
          className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#ff950e] to-[#e88800] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
          style={{ 
            color: '#ffffff !important',
            textDecoration: 'none' 
          }}
        >
          <span style={{ color: '#ffffff' }} className="text-lg">Browse Listings</span>
          <ArrowRight size={20} style={{ color: '#ffffff' }} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        
        {/* Enhanced Tips Section */}
        <div className="mt-12 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
          <p className="text-sm font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff950e]" />
            Pro Tips for Success
          </p>
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 text-left group hover:bg-[#222] p-2 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {tip.icon}
                </div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional CTA */}
        <p className="mt-8 text-sm text-gray-500">
          New to Panty Post? 
          <Link 
            href="/help" 
            className="text-[#ff950e] hover:text-[#e88800] ml-1 font-medium transition-colors"
            style={{ color: '#ff950e !important' }}
          >
            Learn how it works
          </Link>
        </p>
      </div>
    </div>
  );
}
