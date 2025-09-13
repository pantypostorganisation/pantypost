// src/hooks/useIntersectionObserver.ts
import { useEffect, useCallback, useRef, useState } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  onIntersect: () => void;
  enabled?: boolean; // Added to allow disabling the observer
}

export function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverOptions
) {
  // Use refs to maintain stable references
  const savedCallback = useRef(options.onIntersect);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update callback ref when it changes
  useEffect(() => {
    savedCallback.current = options.onIntersect;
  }, [options.onIntersect]);

  // Validate and normalize threshold
  const normalizedThreshold = useCallback(() => {
    const threshold = options.threshold;
    
    if (threshold === undefined || threshold === null) {
      return 0.5;
    }
    
    // Handle array of thresholds
    if (Array.isArray(threshold)) {
      return threshold.map(t => {
        const num = Number(t);
        return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
      });
    }
    
    // Handle single threshold
    const num = Number(threshold);
    return isNaN(num) ? 0.5 : Math.max(0, Math.min(1, num));
  }, [options.threshold]);

  useEffect(() => {
    // Check if observation is enabled (default to true)
    if (options.enabled === false) {
      return;
    }

    // Check for IntersectionObserver support
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported in this browser');
      return;
    }

    try {
      // Create stable callback
      const callback: IntersectionObserverCallback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && savedCallback.current) {
            try {
              savedCallback.current();
            } catch (error) {
              console.error('Error in intersection observer callback:', error);
            }
          }
        });
      };

      // Create observer with validated options
      observerRef.current = new IntersectionObserver(
        callback,
        {
          root: options.root || null,
          rootMargin: options.rootMargin || '0px',
          threshold: normalizedThreshold()
        }
      );

      // Start observing
      const target = targetRef.current;
      if (target && observerRef.current) {
        observerRef.current.observe(target);
      }

      // Cleanup function
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating IntersectionObserver:', error);
      return undefined;
    }
  }, [
    targetRef,
    options.root,
    options.rootMargin,
    options.enabled,
    normalizedThreshold
  ]);

  // Return observer instance for advanced use cases
  return observerRef.current;
}

// Additional hook for observing multiple elements
export function useIntersectionObserverMultiple(
  targetsRef: React.RefObject<HTMLElement[]>,
  options: IntersectionObserverOptions & {
    onIntersect: (element: Element, entry: IntersectionObserverEntry) => void;
  }
) {
  const savedCallback = useRef(options.onIntersect);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    savedCallback.current = options.onIntersect;
  }, [options.onIntersect]);

  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported in this browser');
      return;
    }

    try {
      const callback: IntersectionObserverCallback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && savedCallback.current) {
            try {
              savedCallback.current(entry.target, entry);
            } catch (error) {
              console.error('Error in intersection observer callback:', error);
            }
          }
        });
      };

      observerRef.current = new IntersectionObserver(
        callback,
        {
          root: options.root || null,
          rootMargin: options.rootMargin || '0px',
          threshold: options.threshold || 0.5
        }
      );

      const targets = targetsRef.current;
      if (targets && observerRef.current) {
        targets.forEach(target => {
          if (target) {
            observerRef.current!.observe(target);
          }
        });
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error creating IntersectionObserver:', error);
      return undefined;
    }
  }, [
    targetsRef,
    options.root,
    options.rootMargin,
    options.threshold,
    options.enabled
  ]);

  return observerRef.current;
}

// Utility hook for lazy loading images
export function useLazyImageObserver(
  imageRef: React.RefObject<HTMLImageElement>,
  src: string,
  placeholder?: string
) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);

  useIntersectionObserver(imageRef, {
    onIntersect: () => {
      if (src && !isLoaded) {
        // Validate image URL before setting
        try {
          const url = new URL(src, window.location.origin);
          if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:') {
            setImageSrc(src);
            setIsLoaded(true);
          } else {
            console.warn('Invalid image URL protocol:', url.protocol);
          }
        } catch (error) {
          console.error('Invalid image URL:', src);
        }
      }
    },
    threshold: 0.1,
    enabled: !!src && !isLoaded
  });

  return { imageSrc, isLoaded };
}
