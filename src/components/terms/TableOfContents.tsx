// src/components/terms/TableOfContents.tsx
'use client';

import { TERMS_SECTIONS, LAST_UPDATED } from '@/constants/terms';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface TableOfContentsProps {
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
}

export default function TableOfContents({ activeSection, onSectionClick }: TableOfContentsProps) {
  // Secure click handler that validates section ID
  const handleSectionClick = (sectionId: string) => {
    // Validate that the section ID exists in our constants
    const validSection = TERMS_SECTIONS.find(section => section.id === sectionId);
    if (validSection) {
      onSectionClick(sectionId);
    }
  };

  return (
    <div className="md:w-1/4">
      <div className="bg-[#121212] rounded-xl p-4 sticky top-4">
        <h2 className="text-lg font-semibold text-[#ff950e] mb-4">Contents</h2>
        <ul className="space-y-2 text-sm overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {TERMS_SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`text-left w-full py-1 px-2 rounded transition ${
                  activeSection === section.id
                    ? 'bg-[#ff950e] text-black font-medium'
                    : 'text-gray-300 hover:bg-[#1a1a1a]'
                }`}
              >
                <SecureMessageDisplay 
                  content={section.number ? `${section.number}. ${section.title}` : section.title}
                  allowBasicFormatting={false}
                />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-400">
            Last Updated: <SecureMessageDisplay content={LAST_UPDATED} allowBasicFormatting={false} />
          </p>
        </div>
      </div>
    </div>
  );
}
