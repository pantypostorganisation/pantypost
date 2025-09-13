// src/app/maintenance/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export default function MaintenancePage() {
  const [dots, setDots] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number | null>(null);  // Fixed: Added null as initial value

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Initialize particles
  useEffect(() => {
    const colors = [
      'rgba(255, 149, 14, 0.3)',
      'rgba(255, 149, 14, 0.2)',
      'rgba(255, 255, 255, 0.2)',
      'rgba(255, 255, 255, 0.3)',
      'rgba(255, 107, 0, 0.25)'
    ];

    const initialParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 2 + Math.random() * 4,
      opacity: 0.2 + Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles(initialParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let { x, y, vx, vy } = particle;
          const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const height = typeof window !== 'undefined' ? window.innerHeight : 800;
          
          x += vx;
          y += vy;
          
          // Bounce off edges
          if (x <= 0 || x >= width) {
            vx = -vx + (Math.random() - 0.5) * 0.1;
            x = Math.max(0, Math.min(width, x));
          }
          
          if (y <= 0 || y >= height) {
            vy = -vy + (Math.random() - 0.5) * 0.1;
            y = Math.max(0, Math.min(height, y));
          }
          
          // Random drift
          if (Math.random() < 0.02) {
            vx += (Math.random() - 0.5) * 0.1;
            vy += (Math.random() - 0.5) * 0.1;
            vx = Math.max(-1, Math.min(1, vx));
            vy = Math.max(-1, Math.min(1, vy));
          }
          
          return { ...particle, x, y, vx, vy };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none transition-opacity duration-1000"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${10 * (0.3 + Math.random() * 0.5)}px ${particle.color}`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="PantyPost" 
              className="w-[220px] h-[220px] mx-auto object-contain transition-all duration-300 hover:scale-110 cursor-pointer"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(255, 149, 14, 0.3))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 15px 40px rgba(255, 149, 14, 0.5))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 10px 30px rgba(255, 149, 14, 0.3))';
              }}
            />
          </div>

          {/* Card */}
          <div className="bg-[#111111]/80 backdrop-blur-md border border-gray-800/20 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Under Maintenance
            </h1>
            
            <p className="text-gray-400 text-sm text-center mb-6">
              We'll be back shortly
            </p>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 text-sm mb-6">
              <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-pulse" />
              <span className="text-[#ff950e] font-medium">
                Working on improvements{dots}
              </span>
            </div>

            {/* Message */}
            <p className="text-center text-gray-400 leading-relaxed mb-8">
              Our team is updating PantyPost to bring you
              <br />
              an even better experience. We appreciate
              <br />
              your patience.
            </p>

            {/* Footer */}
            <div className="pt-6 border-t border-white/10 text-center">
              <p className="text-gray-500 text-sm">
                Need assistance? Contact
                <br />
                <span className="text-[#ff950e]">support@pantypost.com</span>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}