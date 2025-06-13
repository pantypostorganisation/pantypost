// src/hooks/useIntersectionObserver.ts
import { useEffect } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  onIntersect: () => void;
}

export function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverOptions
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            options.onIntersect();
          }
        });
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.5
      }
    );

    const target = targetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [targetRef, options.root, options.rootMargin, options.threshold, options.onIntersect]);
}
