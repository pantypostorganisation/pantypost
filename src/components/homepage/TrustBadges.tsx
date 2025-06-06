// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { itemVariants, containerVariants } from '@/utils/motion.config';
import { TRUST_BADGES } from '@/utils/homepage-constants';

// Enhanced loading skeleton for trust badges
const TrustBadgeSkeleton = () => (
  <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg px-3 py-1.5 rounded-full border border-white/10 animate-pulse">
    <div className="w-3.5 h-3.5 bg-gray-600 rounded-sm animate-skeleton"></div>
    <div className="w-16 h-3 bg-gray-600 rounded animate-skeleton delay-75"></div>
  </div>
);

// Enhanced individual trust badge component with comprehensive error handling
const TrustBadge = ({ 
  badge, 
  index, 
  isLoaded,
  onRetry
}: { 
  badge: any; 
  index: number; 
  isLoaded: boolean;
  onRetry?: () => void;
}) => {
  const [iconError, setIconError] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  // Reset error states when badge changes
  useEffect(() => {
    setIconError(false);
    setBadgeError(null);
  }, [badge]);

  if (!isLoaded) {
    return <TrustBadgeSkeleton />;
  }

  // Enhanced fallback icon component with better variety
  const getFallbackIcon = () => {
    const fallbackIcons = ['✓', '🛡️', '⭐', '🔒', '💳', '🔐'];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const FallbackIcon = () => (
    <div className="w-3.5 h-3.5 bg-[#ff950e] rounded-sm flex items-center justify-center">
      <span className="text-[8px] font-bold text-black">{getFallbackIcon()}</span>
    </div>
  );

  // Enhanced error state for individual badges
  if (badgeError) {
    return (
      <span className="flex items-center gap-1.5 bg-red-900/20 backdrop-blur-lg text-red-400 px-3 py-1.5 rounded-full text-xs border border-red-500/30 error-state transition-all duration-300">
        <div className="w-3.5 h-3.5 bg-red-500/20 rounded-sm flex items-center justify-center">
          <span className="text-[8px] font-bold text-red-400">!</span>
        </div>
        <span className="font-medium select-none">Error</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 text-[10px] underline hover:no-underline focus:outline-none"
            title="Retry loading badge"
          >
            Retry
          </button>
        )}
      </span>
    );
  }

  try {
    // Basic validation for badge object - much more lenient
    if (!badge || typeof badge !== 'object') {
      throw new Error('Invalid badge object');
    }

    if (!badge.text || typeof badge.text !== 'string' || badge.text.trim().length === 0) {
      throw new Error('Invalid or missing badge text');
    }

    // More lenient icon validation - just check if it exists, don't validate as function
    if (!badge.icon) {
      console.warn('Missing icon for badge:', badge.text);
      setIconError(true);
    }

    return (
      <motion.span
        className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md hover:scale-105 group cursor-default"
        variants={itemVariants}
        whileHover={{ 
          scale: 1.05,
          transition: { duration: 0.2 }
        }}
        role="img"
        aria-label={`Trust indicator: ${badge.text}`}
      >
        {iconError || !badge.icon ? (
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
    setBadgeError(error instanceof Error ? error.message : 'Unknown error');
    return null; // This will trigger the error state on next render
  }
};

export default function TrustBadges() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [validBadges, setValidBadges] = useState<any[]>([]);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // Simplified badge loading with basic validation
  const loadBadges = useCallback(async () => {
    try {
      setSectionError(null);
      
      // Much more lenient validation - just check basic structure
      const validated = TRUST_BADGES.filter(badge => {
        // Basic checks only
        if (!badge || typeof badge !== 'object') {
          console.warn('Invalid badge object:', badge);
          return false;
        }
        
        // Just check if text exists and is a string
        if (typeof badge.text !== 'string' || badge.text.trim().length === 0) {
          console.warn('Invalid or missing text for badge:', badge);
          return false;
        }
        
        // Don't validate icon here - let the component handle it
        return true;
      });

      console.log('Validated badges:', validated); // Debug log

      if (validated.length === 0) {
        throw new Error('No badges found in TRUST_BADGES configuration');
      }

      setValidBadges(validated);
      
      // Simulate loading delay for better UX (shorter than features)
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsLoaded(true);
      
    } catch (error) {
      console.error('Error loading trust badges:', error);
      setSectionError(error instanceof Error ? error.message : 'Unknown error');
      
      // Enhanced fallback badges with proper structure
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

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleRetry = useCallback(() => {
    setIsLoaded(false);
    setValidBadges([]);
    loadBadges();
  }, [loadBadges]);

  const handleBadgeRetry = useCallback((index: number) => {
    // For individual badge retry, we'll reload the entire component for simplicity
    handleRetry();
  }, [handleRetry]);

  // Error state for entire trust badges section
  if (sectionError && !isLoaded) {
    return (
      <div className="flex gap-2.5 mt-6 flex-wrap justify-center md:justify-start">
        <span className="flex items-center gap-1.5 bg-red-900/20 backdrop-blur-lg text-red-400 px-3 py-1.5 rounded-full text-xs border border-red-500/30 error-state">
          <div className="w-3.5 h-3.5 bg-red-500/20 rounded-sm flex items-center justify-center">
            <span className="text-[8px] font-bold">!</span>
          </div>
          <span className="font-medium select-none">Trust badges unavailable</span>
          <button
            onClick={handleRetry}
            className="ml-1 text-[10px] underline hover:no-underline focus:outline-none"
            title="Retry loading trust badges"
          >
            Retry
          </button>
        </span>
      </div>
    );
  }

  return (
    <>
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
            onRetry={() => handleBadgeRetry(index)}
          />
        ))}
      </motion.div>
      
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
              "Privacy protection",
              "Age verification (21+)",
              "Secure messaging system"
            ],
            "safetyFeatures": [
              "User blocking and reporting",
              "Content moderation",
              "Identity verification",
              "Secure financial transactions"
            ]
          })
        }}
      />
    </>
  );
}
