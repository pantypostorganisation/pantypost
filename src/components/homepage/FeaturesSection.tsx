// src/components/homepage/FeaturesSection.tsx
'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { PLATFORM_FEATURES } from '@/utils/homepage-constants';

// Loading skeleton for feature cards
const FeatureSkeleton = () => (
  <div className="bg-[#131313] rounded-xl p-6 border border-white/10 animate-pulse">
    <div className="w-12 h-12 bg-gray-700 rounded-full mb-5"></div>
    <div className="w-3/4 h-6 bg-gray-700 rounded mb-3"></div>
    <div className="space-y-2">
      <div className="w-full h-4 bg-gray-800 rounded"></div>
      <div className="w-5/6 h-4 bg-gray-800 rounded"></div>
      <div className="w-4/6 h-4 bg-gray-800 rounded"></div>
    </div>
  </div>
);

// Enhanced feature card with error handling
const FeatureCard = ({ 
  feature, 
  index, 
  isLoaded 
}: { 
  feature: any; 
  index: number; 
  isLoaded: boolean;
}) => {
  const [iconError, setIconError] = useState(false);

  if (!isLoaded) {
    return <FeatureSkeleton />;
  }

  // Fallback icon based on feature type
  const getFallbackIcon = () => {
    const fallbackIcons = ['📱', '💖', '📈'];
    return fallbackIcons[index % fallbackIcons.length];
  };

  const FallbackIcon = () => (
    <div className="h-6 w-6 flex items-center justify-center text-[#ff950e]">
      {getFallbackIcon()}
    </div>
  );

  try {
    return (
      <motion.div
        className="group relative bg-[#131313] rounded-xl p-6 transition-all duration-300 border border-white/10 hover:border-[#ff950e]/50 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff950e]/10"
        variants={itemVariants}
        whileHover={{ y: -8 }}
        role="article"
        aria-labelledby={`feature-title-${index}`}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
        </div>
        
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-full flex items-center justify-center mb-5 border border-[#ff950e]/20 group-hover:scale-110 transition-transform duration-300">
            {iconError ? (
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
            {feature.title}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
            {feature.desc}
          </p>
        </div>
      </motion.div>
    );
  } catch (error) {
    console.warn('Feature card render error:', error);
    return (
      <div className="bg-[#131313] rounded-xl p-6 border border-red-800/30">
        <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-5">
          <span className="text-red-400">!</span>
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-3">Feature Unavailable</h3>
        <p className="text-gray-500 text-sm">This feature could not be loaded.</p>
      </div>
    );
  }
};

export default function FeaturesSection() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [validFeatures, setValidFeatures] = useState<any[]>([]);

  useEffect(() => {
    try {
      // Fixed: Proper validation that won't always return true
      const validated = PLATFORM_FEATURES.filter(feature => {
        // Check if feature exists and has required properties
        if (!feature) return false;
        
        // Check if icon is a valid React component (not just truthy)
        if (!feature.icon || typeof feature.icon !== 'function') return false;
        
        // Check if title and desc are valid strings with content
        if (typeof feature.title !== 'string' || feature.title.trim().length === 0) return false;
        if (typeof feature.desc !== 'string' || feature.desc.trim().length === 0) return false;
        
        return true;
      });

      if (validated.length === 0) {
        throw new Error('No valid features found');
      }

      setValidFeatures(validated);
      
      // Staggered loading for better UX
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 150);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error loading features:', error);
      
      // Fallback features
      const fallbackFeatures = [
        { 
          icon: () => <span>📱</span>, 
          title: 'Browse Marketplace', 
          desc: 'Explore premium listings from verified sellers.' 
        },
        { 
          icon: () => <span>💖</span>, 
          title: 'Connect Safely', 
          desc: 'Secure messaging and subscription system.' 
        },
        { 
          icon: () => <span>📈</span>, 
          title: 'Earn Revenue', 
          desc: 'Start selling and build your customer base.' 
        },
      ];
      
      setValidFeatures(fallbackFeatures);
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className="bg-gradient-to-b from-black to-[#101010] pt-16 pb-16 md:pt-20 md:pb-20 relative z-30 overflow-hidden">
      {/* Enhanced SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
            "featureList": validFeatures.map(feature => feature.title),
            "description": "Premium marketplace platform with secure messaging, verified sellers, and subscription services"
          })
        }}
      />

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
            />
          ))}
        </motion.div>
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
