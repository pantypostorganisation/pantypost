// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { itemVariants, containerVariants } from '@/utils/motion.config';
import { TRUST_BADGES } from '@/utils/homepage-constants';

// Loading skeleton for trust badges
const TrustBadgeSkeleton = () => (
  <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg px-3 py-1.5 rounded-full border border-white/10 animate-pulse">
    <div className="w-3.5 h-3.5 bg-gray-600 rounded-sm"></div>
    <div className="w-16 h-3 bg-gray-600 rounded"></div>
  </div>
);

// Individual trust badge component with error handling
const TrustBadge = ({ 
  badge, 
  index, 
  isLoaded 
}: { 
  badge: any; 
  index: number; 
  isLoaded: boolean;
}) => {
  const [iconError, setIconError] = useState(false);

  if (!isLoaded) {
    return <TrustBadgeSkeleton />;
  }

  // Fallback icon component
  const FallbackIcon = () => (
    <div className="w-3.5 h-3.5 bg-[#ff950e] rounded-sm flex items-center justify-center">
      <span className="text-[8px] font-bold text-black">✓</span>
    </div>
  );

  try {
    return (
      <motion.span
        className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md group cursor-default"
        variants={itemVariants}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        role="img"
        aria-label={`Trust indicator: ${badge.text}`}
      >
        {iconError ? (
          <FallbackIcon />
        ) : (
          <badge.icon 
            className="w-3.5 h-3.5 text-[#ff950e] group-hover:scale-110 transition-transform duration-200" 
            onError={() => setIconError(true)}
            aria-hidden="true"
          />
        )}
        <span className="font-medium select-none">{badge.text}</span>
      </motion.span>
    );
  } catch (error) {
    console.warn('Trust badge render error:', error);
    return (
      <span className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10">
        <FallbackIcon />
        <span>{badge.text || 'Trusted'}</span>
      </span>
    );
  }
};

export default function TrustBadges() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [validBadges, setValidBadges] = useState<any[]>([]);

  useEffect(() => {
    try {
      // Fixed: Proper validation that won't always return true
      const validated = TRUST_BADGES.filter(badge => {
        // Check if badge exists and has required properties
        if (!badge) return false;
        
        // Check if icon is a valid React component (not just truthy)
        if (!badge.icon || typeof badge.icon !== 'function') return false;
        
        // Check if text is a valid string with content
        if (typeof badge.text !== 'string' || badge.text.trim().length === 0) return false;
        
        return true;
      });

      if (validated.length === 0) {
        throw new Error('No valid trust badges found');
      }

      setValidBadges(validated);
      
      // Simulate loading delay for better UX
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 300);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error loading trust badges:', error);
      
      // Fallback badges
      const fallbackBadges = [
        { icon: () => <span>🛡️</span>, text: 'Secure' },
        { icon: () => <span>⭐</span>, text: 'Verified' },
        { icon: () => <span>💳</span>, text: 'Safe Payments' },
        { icon: () => <span>🔒</span>, text: 'Encrypted' },
      ];
      
      setValidBadges(fallbackBadges);
      setIsLoaded(true);
    }
  }, []);

  return (
    <motion.div 
      className="flex gap-2.5 mt-6 flex-wrap justify-center md:justify-start" 
      variants={containerVariants}
      role="region"
      aria-label="Trust and security indicators"
    >
      {validBadges.map((badge, index) => (
        <TrustBadge
          key={`trust-badge-${index}-${badge.text}`}
          badge={badge}
          index={index}
          isLoaded={isLoaded}
        />
      ))}
      
      {/* Enhanced SEO structured data for trust signals */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "PantyPost",
            "trustIndicators": validBadges.map(badge => badge.text),
            "securityMeasures": [
              "End-to-end encryption",
              "Verified seller system", 
              "Secure payment processing",
              "Privacy protection"
            ]
          })
        }}
      />
    </motion.div>
  );
}
