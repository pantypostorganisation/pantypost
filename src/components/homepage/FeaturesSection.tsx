// src/components/homepage/FeaturesSection.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { PLATFORM_FEATURES } from '@/utils/homepage-constants';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Enhanced loading skeleton for feature cards
const FeatureSkeleton = () => (
  <div className="bg-[#131313] rounded-xl p-6 border border-white/10 animate-pulse">
    <div className="w-12 h-12 bg-gray-700 rounded-full mb-5 animate-skeleton"></div>
    <div className="space-y-3">
      <div className="w-3/4 h-6 bg-gray-700 rounded animate-skeleton delay-75"></div>
      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-800 rounded animate-skeleton delay-150"></div>
        <div className="w-5/6 h-4 bg-gray-800 rounded animate-skeleton delay-300"></div>
        <div className="w-4/6 h-4 bg-gray-800 rounded animate-skeleton delay-75"></div>
      </div>
    </div>
  </div>
);

// Enhanced feature card with better error handling and retry functionality
const FeatureCard = ({ 
  feature, 
  index, 
  isLoaded,
  onRetry 
}: { 
  feature: any; 
  index: number; 
  isLoaded: boolean;
  onRetry?: () => void;
}) => {
  const [iconError, setIconError] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Reset error state when feature changes
  useEffect(() => {
    setIconError(false);
    setCardError(null);
  }, [feature]);

  if (!isLoaded) {
    return <FeatureSkeleton />;
  }

  // Enhanced fallback icon with better variety
  const getFallbackIcon = () => {
    const fallbackIcons = ['🚀', '💖', '📈', '🔒', '⭐', '🛡️'];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const FallbackIcon = () => (
    <div className="h-6 w-6 flex items-center justify-center text-[#ff950e] text-lg">
      {getFallbackIcon()}
    </div>
  );

  // Enhanced error state for individual cards
  if (cardError) {
    return (
      <div className="bg-[#131313] rounded-xl p-6 border border-red-800/30 error-state transition-all duration-300">
        <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-5">
          <span className="text-red-400 text-xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-3">Feature Unavailable</h3>
        <p className="text-gray-500 text-sm mb-4">This feature could not be loaded.</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-gray-600 text-xs mb-4 font-mono bg-gray-900/50 p-2 rounded">
            {cardError}
          </p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[#ff950e] text-sm hover:underline hover:text-[#ff6b00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  try {
    // Basic validation for feature object - much more lenient
    if (!feature || typeof feature !== 'object') {
      throw new Error('Invalid feature object');
    }

    if (!feature.title || typeof feature.title !== 'string' || feature.title.trim().length === 0) {
      throw new Error('Invalid or missing feature title');
    }

    if (!feature.desc || typeof feature.desc !== 'string' || feature.desc.trim().length === 0) {
      throw new Error('Invalid or missing feature description');
    }

    // More lenient icon validation - just check if it exists, don't validate as function
    if (!feature.icon) {
      console.warn('Missing icon for feature:', feature.title);
      setIconError(true);
    }

    // Sanitize text content
    const sanitizedTitle = sanitizeStrict(feature.title);
    const sanitizedDesc = sanitizeStrict(feature.desc);

    return (
      <motion.div
        className="group relative bg-[#131313] rounded-xl p-6 transition-all duration-300 border border-white/10 hover:border-[#ff950e]/50 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff950e]/10"
        variants={itemVariants}
        whileHover={{ y: -8 }}
        role="article"
        aria-labelledby={`feature-title-${index}`}
      >
        {/* Enhanced shine effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
        </div>
        
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-full flex items-center justify-center mb-5 border border-[#ff950e]/20 group-hover:scale-110 transition-transform duration-300">
            {iconError || !feature.icon ? (
              <FallbackIcon />
            ) : (
              <feature.icon 
                className="h-6 w-6 text-[#ff950e]" 
                onError={() => setIconError(true)}
                aria-hidden="true"
              />
            )}
          </div>
          <h3 
            id={`feature-title-${index}`}
            className="text-xl font-semibold text-white mb-3 group-hover:text-[#ff950e] transition-colors duration-300"
          >
            {sanitizedTitle}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
            {sanitizedDesc}
          </p>
        </div>
      </motion.div>
    );
  } catch (error) {
    console.warn('Feature card render error:', error);
    setCardError(error instanceof Error ? error.message : 'Unknown error');
    return null; // This will trigger the error state on next render
  }
};

export default function FeaturesSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [validFeatures, setValidFeatures] = useState<any[]>([]);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // Simplified feature loading with basic validation
  const loadFeatures = useCallback(async () => {
    try {
      setSectionError(null);
      
      // Much more lenient validation - just check basic structure
      const validated = PLATFORM_FEATURES.filter(feature => {
        // Basic checks only
        if (!feature || typeof feature !== 'object') {
          console.warn('Invalid feature object:', feature);
          return false;
        }
        
        // Check if title is a valid string with content
        if (typeof feature.title !== 'string' || feature.title.trim().length === 0) {
          console.warn('Invalid or missing title for feature:', feature);
          return false;
        }
        
        // Check if desc is a valid string with content
        if (typeof feature.desc !== 'string' || feature.desc.trim().length === 0) {
          console.warn('Invalid or missing description for feature:', feature.title);
          return false;
        }
        
        // Don't validate icon here - let the component handle it
        return true;
      });

      console.log('Validated features:', validated); // Debug log

      if (validated.length === 0) {
        throw new Error('No features found in PLATFORM_FEATURES configuration');
      }

      setValidFeatures(validated);
      
      // Simulate realistic loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsLoaded(true);
      
    } catch (error) {
      console.error('Error loading features:', error);
      setSectionError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback features with proper structure
      const fallbackFeatures = [
        { 
          icon: () => <span>🚀</span>, 
          title: 'Browse Marketplace', 
          desc: 'Explore premium listings from verified sellers in a secure environment.' 
        },
        { 
          icon: () => <span>💖</span>, 
          title: 'Connect Safely', 
          desc: 'Secure messaging and subscription system for authentic interactions.' 
        },
        { 
          icon: () => <span>📈</span>, 
          title: 'Earn Revenue', 
          desc: 'Start selling and build your customer base with our tier system.' 
        },
      ];
      
      setValidFeatures(fallbackFeatures);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const handleRetry = useCallback(() => {
    setIsLoaded(false);
    setValidFeatures([]);
    loadFeatures();
  }, [loadFeatures]);

  const handleFeatureRetry = useCallback((index: number) => {
    // For individual feature retry, we'll reload the entire section for simplicity
    handleRetry();
  }, [handleRetry]);

  // Create safe structured data
  const getStructuredData = () => {
    try {
      return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "PantyPost",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": validFeatures.map(feature => sanitizeStrict(feature.title || '')),
        "description": "Premium marketplace platform with secure messaging, verified sellers, and subscription services",
        "audience": {
          "@type": "Audience",
          "audienceType": "Adult"
        }
      };
    } catch (error) {
      console.warn('Failed to create structured data:', error);
      return null;
    }
  };

  const structuredData = getStructuredData();

  return (
    <div className="bg-gradient-to-b from-black to-[#101010] pt-16 pb-16 md:pt-20 md:pb-20 relative z-30 overflow-hidden">
      {/* Enhanced SEO structured data - secured */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white mb-16 tracking-tight"
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, amount: 0.5 }} 
          variants={itemVariants}
        >
          How <span className="text-[#ff950e]">PantyPost</span> Works
        </motion.h2>
        
        {/* Error state for entire section */}
        {sectionError && !isLoaded ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-red-400 mb-4">Features Unavailable</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We're having trouble loading the platform features. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-gray-600 text-sm mb-6 font-mono bg-gray-900/50 p-4 rounded max-w-md mx-auto">
                {sanitizeStrict(sectionError)}
              </p>
            )}
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-[#ff950e] text-black font-semibold rounded-lg hover:bg-[#e88800] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black"
            >
              Try Again
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" 
            whileInView="visible" 
            viewport={VIEWPORT_CONFIG} 
            variants={containerVariants}
            role="region"
            aria-label="Platform features"
          >
            {validFeatures.map((feature, index) => (
              <FeatureCard
                key={`feature-${index}-${feature.title}`}
                feature={feature}
                index={index}
                isLoaded={isLoaded}
                onRetry={() => handleFeatureRetry(index)}
              />
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Shape Divider 2 (Background Glow) */}
      <motion.div
        className="absolute -bottom-48 right-[-20%] md:right-[-10%] w-[120%] md:w-[80%] h-96 pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        variants={shapeVariants}
        role="presentation"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/10 via-transparent to-transparent blur-3xl rounded-[70%_30%_40%_60%/50%_60%_40%_50%] animate-spin-slow"></div>
      </motion.div>
    </div>
  );
}
