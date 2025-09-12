// src/app/maintenance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Hammer, Wrench, HardHat, Clock, AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');
  
  // Animated dots for "Working on it..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 overflow-hidden relative">
      {/* Background gradient effects matching your site style */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff950e]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff950e]/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Floating construction icons background */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${10 + i * 2}s`
            }}
          >
            {i % 3 === 0 ? (
              <Hammer className="w-12 h-12 text-[#ff950e] rotate-45" />
            ) : i % 3 === 1 ? (
              <Wrench className="w-10 h-10 text-[#ff950e] -rotate-12" />
            ) : (
              <HardHat className="w-14 h-14 text-[#ff950e] rotate-12" />
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Construction animation */}
        <div className="mb-8 relative">
          {/* Brick wall */}
          <div className="mx-auto w-48 h-32 relative">
            <div className="absolute inset-0 grid grid-cols-6 gap-[2px]">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-orange-900 to-orange-950 rounded-sm border border-orange-800/50 animate-appear"
                  style={{
                    animationDelay: `${i * 0.05}s`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Animated hammer */}
            <div className="absolute -top-8 right-0 animate-hammer">
              <Hammer className="w-12 h-12 text-[#ff950e] rotate-45" />
            </div>
            
            {/* Hard hat on wall */}
            <div className="absolute -top-6 left-8">
              <HardHat className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Warning badge */}
        <div className="inline-flex items-center gap-2 bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-full px-4 py-2 mb-6">
          <AlertTriangle className="w-4 h-4 text-[#ff950e] animate-pulse" />
          <span className="text-[#ff950e] text-sm font-semibold uppercase tracking-wider">
            Under Construction
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
          We're Building
          <span className="block text-[#ff950e] mt-2">Something Amazing</span>
        </h1>

        {/* Subheading with animated dots */}
        <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
          Our team is working hard to bring you an enhanced PantyPost experience. 
          We'll be back online shortly!
        </p>

        {/* Working status */}
        <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-6 py-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Working on it{dots}</span>
          </div>
          <Wrench className="w-5 h-5 text-[#ff950e] animate-spin-slow" />
        </div>

        {/* Estimated time */}
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-12">
          <Clock className="w-5 h-5" />
          <span className="text-sm">Estimated downtime: 30 minutes</span>
        </div>

        {/* Contact info */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-gray-500 text-sm">
            Need urgent assistance? Contact support at{' '}
            <a 
              href="mailto:support@pantypost.com" 
              className="text-[#ff950e] hover:underline"
            >
              support@pantypost.com
            </a>
          </p>
        </div>

        {/* Fun progress bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ff950e] to-[#ffb347] rounded-full animate-pulse transition-all duration-500"
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          75% { transform: translateY(20px) rotate(-5deg); }
        }
        
        @keyframes hammer {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(25deg) translateY(10px); }
        }
        
        @keyframes appear {
          0% { 
            opacity: 0; 
            transform: scale(0.8) translateY(-10px);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-hammer {
          animation: hammer 1.5s ease-in-out infinite;
        }
        
        .animate-appear {
          animation: appear 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}