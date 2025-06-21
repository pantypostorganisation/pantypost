// src/app/terms/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTermsScroll } from '@/hooks/useTermsScroll';
import TableOfContents from '@/components/terms/TableOfContents';
import TermsSection from '@/components/terms/TermsSection';
import { TERMS_SECTIONS, LAST_UPDATED } from '@/constants/terms';
import { ExpandedSectionsState } from '@/types/terms';

export default function TermsPage() {
  const { activeSection, scrollToSection } = useTermsScroll();
  
  // Initialize all sections as expanded
  const [expandedSections, setExpandedSections] = useState<ExpandedSectionsState>(() => {
    const initialState: ExpandedSectionsState = {};
    TERMS_SECTIONS.forEach(section => {
      initialState[section.id] = true;
    });
    return initialState;
  });

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Table of Contents - Sidebar */}
          <TableOfContents 
            activeSection={activeSection} 
            onSectionClick={scrollToSection} 
          />

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-[#121212] rounded-xl p-6 md:p-8 shadow-xl">
              {TERMS_SECTIONS.map((section, index) => (
                <TermsSection
                  key={section.id}
                  section={section}
                  isExpanded={expandedSections[section.id]}
                  onToggle={() => toggleSection(section.id)}
                  isFirst={index === 0}
                />
              ))}

              {/* Footer with timestamp */}
              <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-sm text-gray-400">
                  Last Updated: {LAST_UPDATED}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
