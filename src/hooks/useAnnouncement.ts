// src/hooks/useAnnouncement.ts
import { useEffect, useRef, useState, useCallback } from 'react';

const cleanText = (message: string, maxLen = 300) => {
  const s = typeof message === 'string' ? message : '';
  // strip tags & collapse whitespace
  const stripped = s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, maxLen);
};

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timers on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  const announce = useCallback((message: string, delay = 100) => {
    const text = cleanText(message);

    // clear existing timers if any
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);

    showTimeoutRef.current = setTimeout(() => {
      setAnnouncement(text);
      clearTimeoutRef.current = setTimeout(() => setAnnouncement(''), 1000);
    }, Math.max(0, delay | 0));
  }, []);

  return { announcement, announce };
}
