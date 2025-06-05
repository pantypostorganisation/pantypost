// src/utils/motion.config.ts
import { Variants } from 'framer-motion';

// Standardized viewport configuration
export const VIEWPORT_CONFIG = {
  once: true,
  amount: 0.3,
} as const;

// Animation variants - exactly matching your original
export const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: 'easeOut' 
    } 
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.8, 
      ease: 'easeOut' 
    } 
  },
};

export const shapeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] 
    }
  },
};

// Floating animation for particles - exactly matching your original
export const floatVariants = {
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

// Hook to check for reduced motion preference
export const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};