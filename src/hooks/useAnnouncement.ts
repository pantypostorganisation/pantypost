// src/hooks/useAnnouncement.ts

import { useState, useCallback } from 'react';

export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, delay = 100) => {
    setTimeout(() => {
      setAnnouncement(message);
      // Clear after announcement
      setTimeout(() => setAnnouncement(''), 1000);
    }, delay);
  }, []);

  return { announcement, announce };
}