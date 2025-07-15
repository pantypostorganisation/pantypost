// src/hooks/useTermsScroll.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Valid section IDs to prevent manipulation
const VALID_SECTION_IDS = [
  'introduction',
  'acceptance',
  'age-requirements',
  'account-registration',
  'listing-rules',
  'prohibited-content',
  'transactions',
  'fees',
  'user-conduct',
  'privacy',
  'intellectual-property',
  'disclaimers',
  'termination',
  'changes',
  'contact'
] as const;

type ValidSectionId = typeof VALID_SECTION_IDS[number];

// Throttle function for performance
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export const useTermsScroll = () => {
  const [activeSection, setActiveSection] = useState<ValidSectionId | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Validate section ID
  const isValidSectionId = useCallback((id: string): id is ValidSectionId => {
    return VALID_SECTION_IDS.includes(id as ValidSectionId);
  }, []);

  // Sanitize and validate section ID
  const sanitizeSectionId = useCallback((sectionId: string): ValidSectionId | null => {
    try {
      // Sanitize the ID first
      const sanitized = sanitizeStrict(sectionId).toLowerCase().trim();
      
      // Check if it's valid
      if (isValidSectionId(sanitized)) {
        return sanitized;
      }
      
      console.warn(`Invalid section ID attempted: ${sectionId}`);
      return null;
    } catch (error) {
      console.error('Error sanitizing section ID:', error);
      return null;
    }
  }, [isValidSectionId]);

  const scrollToSection = useCallback((sectionId: string) => {
    // Validate and sanitize the section ID
    const validSectionId = sanitizeSectionId(sectionId);
    
    if (!validSectionId) {
      console.error('Invalid section ID provided');
      return;
    }

    try {
      setActiveSection(validSectionId);
      setIsScrolling(true);

      const element = document.getElementById(validSectionId);
      
      if (element && element instanceof HTMLElement) {
        // Validate element is actually in the document
        if (!document.body.contains(element)) {
          console.error('Element not found in document');
          return;
        }
        
        const yOffset = -80; // Adjust based on your header height
        const rect = element.getBoundingClientRect();
        
        // Validate rect values
        if (isNaN(rect.top) || !isFinite(rect.top)) {
          console.error('Invalid element position');
          return;
        }
        
        const y = rect.top + window.pageYOffset + yOffset;

        // Ensure y is a valid number
        if (isNaN(y) || !isFinite(y)) {
          console.error('Invalid scroll position calculated');
          return;
        }

        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Reset scrolling state after animation completes
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
          scrollTimeoutRef.current = null;
        }, 800);
      } else {
        console.warn(`Section not found: ${validSectionId}`);
        setIsScrolling(false);
      }
    } catch (error) {
      console.error('Error scrolling to section:', error);
      setIsScrolling(false);
    }
  }, [sanitizeSectionId]);

  useEffect(() => {
    if (isScrolling) return;

    // Use Intersection Observer for better performance
    const setupObserver = () => {
      try {
        // Clean up existing observer
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        const options = {
          rootMargin: '-80px 0px -80% 0px',
          threshold: [0, 0.5, 1]
        };

        observerRef.current = new IntersectionObserver((entries) => {
          let mostVisibleSection: ValidSectionId | null = null;
          let highestRatio = 0;

          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
              const sectionId = entry.target.id;
              
              if (isValidSectionId(sectionId)) {
                mostVisibleSection = sectionId;
                highestRatio = entry.intersectionRatio;
              }
            }
          });

          if (mostVisibleSection) {
            setActiveSection(mostVisibleSection);
          }
        }, options);

        // Observe all valid sections
        VALID_SECTION_IDS.forEach(id => {
          const element = document.getElementById(id);
          if (element && document.body.contains(element)) {
            observerRef.current?.observe(element);
          }
        });

        // Return cleanup function for consistency
        return undefined;
      } catch (error) {
        console.error('Error setting up intersection observer:', error);
        
        // Fallback to scroll event if Intersection Observer fails
        const handleScroll = throttle(() => {
          try {
            const sections = document.querySelectorAll('section[id]');
            let currentSection: ValidSectionId | null = null;

            sections.forEach((section) => {
              if (!(section instanceof HTMLElement)) return;
              
              const sectionId = section.id;
              if (!isValidSectionId(sectionId)) return;
              
              const rect = section.getBoundingClientRect();
              
              if (rect.top <= 100 && rect.top > -rect.height) {
                currentSection = sectionId;
              }
            });

            setActiveSection(currentSection);
          } catch (error) {
            console.error('Error handling scroll:', error);
          }
        }, 100); // Throttle to 100ms

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check on mount

        return () => window.removeEventListener('scroll', handleScroll);
      }
    };

    const cleanup = setupObserver();

    // Cleanup
    return () => {
      if (cleanup) {
        cleanup();
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [isScrolling, isValidSectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { 
    activeSection, 
    scrollToSection,
    validSectionIds: VALID_SECTION_IDS 
  };
};