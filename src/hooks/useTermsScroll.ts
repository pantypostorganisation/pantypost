// src/hooks/useTermsScroll.ts
import { useState, useEffect, useCallback } from 'react';

export const useTermsScroll = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setIsScrolling(true);

    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Adjust based on your header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });

      // Reset scrolling state after animation completes
      setTimeout(() => setIsScrolling(false), 800);
    }
  }, []);

  useEffect(() => {
    if (isScrolling) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentSection: string | null = null;

      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop <= 100) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolling]);

  return { activeSection, scrollToSection };
};