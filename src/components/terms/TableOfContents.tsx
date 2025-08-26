// src/components/terms/TableOfContents.tsx
'use client';

import { useMemo } from 'react';
import { TERMS_SECTIONS, LAST_UPDATED } from '@/constants/terms';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface TableOfContentsProps {
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
}

export default function TableOfContents({ activeSection, onSectionClick }: TableOfContentsProps) {
  // Precompute the valid section IDs for quick validation
  const validIds = useMemo(() => new Set(TERMS_SECTIONS.map((s) => s.id)), []);

  // Secure click handler that validates section ID
  const handleSectionClick = (sectionId: string) => {
    if (validIds.has(sectionId)) {
      onSectionClick(sectionId);
    }
  };

  return (
    <div className="md:w-1/4">
      <nav
        className="bg-[#121212] rounded-xl p-4 sticky top-4"
        aria-label="Terms of Service Table of Contents"
      >
        <h2 className="text-lg font-semibold text-[#ff950e] mb-4">Contents</h2>

        <ul
          className="space-y-2 text-sm overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          role="listbox"
          aria-activedescendant={activeSection ?? undefined}
        >
          {TERMS_SECTIONS.map((section) => (
            <li key={section.id} role="option" aria-selected={activeSection === section.id}>
              <button
                type="button"
                onClick={() => handleSectionClick(section.id)}
                className={`text-left w-full py-1 px-2 rounded transition ${
                  activeSection === section.id
                    ? 'bg-[#ff950e] text-black font-medium'
                    : 'text-gray-300 hover:bg-[#1a1a1a]'
                }`}
                id={section.id}
              >
                <SecureMessageDisplay
                  content={section.number ? `${section.number}. ${section.title}` : section.title}
                  allowBasicFormatting={false}
                  maxLength={200}
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-gray-800 pt-4">
          <div className="text-xs text-gray-400">
            Last Updated:{' '}
            <SecureMessageDisplay content={LAST_UPDATED} allowBasicFormatting={false} maxLength={64} />
          </div>
        </div>
      </nav>
    </div>
  );
}
