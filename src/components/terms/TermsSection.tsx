// src/components/terms/TermsSection.tsx
'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { TermsSection as TermsSectionType } from '@/types/terms';

interface TermsSectionProps {
  section: TermsSectionType;
  isExpanded: boolean;
  onToggle: () => void;
  isFirst?: boolean;
}

export default function TermsSection({ 
  section, 
  isExpanded, 
  onToggle, 
  isFirst = false 
}: TermsSectionProps) {
  return (
    <section 
      id={section.id} 
      className={`mb-8 ${!isFirst ? 'border-t border-gray-800 pt-6' : ''}`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={onToggle}
      >
        <h2 className="text-xl font-bold text-white flex items-center">
          {section.number && (
            <span className="bg-[#1a1a1a] text-[#ff950e] rounded-full w-8 h-8 inline-flex items-center justify-center mr-3 flex-shrink-0">
              {section.number}
            </span>
          )}
          {section.id === 'introduction' ? (
            <span className="text-2xl">{section.title}</span>
          ) : (
            section.title
          )}
        </h2>
        {isExpanded ? 
          <ChevronUp className="h-5 w-5 text-gray-400" /> : 
          <ChevronDown className="h-5 w-5 text-gray-400" />
        }
      </div>
      
      {isExpanded && (
        <div className={`mt-4 ${section.number ? 'pl-11' : ''} space-y-6`}>
          {section.id === 'introduction' && (
            <div className="space-y-4 text-gray-300 leading-relaxed">
              {section.content.map((item, index) => (
                <p key={index} className={item.text === 'Effective Date: 1st October 2024' ? 'text-[#ff950e] font-medium' : ''}>
                  {item.text}
                </p>
              ))}
            </div>
          )}
          
          {section.id !== 'introduction' && section.content.map((item, index) => {
            if (item.type === 'paragraph') {
              return (
                <div key={index} className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-gray-300 leading-relaxed">{item.text}</p>
                </div>
              );
            }
            
            if (item.type === 'heading') {
              return (
                <div key={index} className="bg-[#1a1a1a] p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-[#ff950e] mb-2">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">{item.text}</p>
                </div>
              );
            }
            
            if (item.type === 'list' && item.items) {
              return (
                <ul key={index} className="list-disc pl-5 text-gray-300 space-y-1">
                  {item.items.map((listItem, listIndex) => (
                    <li key={listIndex}>{listItem}</li>
                  ))}
                </ul>
              );
            }
            
            return null;
          })}
        </div>
      )}
    </section>
  );
}
