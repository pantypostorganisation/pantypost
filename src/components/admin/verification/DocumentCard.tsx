// src/components/admin/verification/DocumentCard.tsx
'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { DocumentCardProps } from '@/types/verification';

export default function DocumentCard({ 
  title, 
  imageSrc, 
  onViewFull 
}: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm uppercase text-gray-400 font-medium tracking-wider flex items-center">
        {title}
      </h3>
      
      {imageSrc ? (
        <div 
          className="relative border border-[#222] rounded-lg overflow-hidden h-[200px] sm:h-[250px] bg-[#0a0a0a] transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="w-full h-full overflow-hidden flex items-center justify-center">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-contain transition-transform duration-500"
              style={{ 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)' 
              }}
            />
          </div>
          
          {/* Gradient overlay on hover */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 transition-opacity duration-300 flex items-end justify-center p-4"
            style={{ opacity: isHovered ? 0.8 : 0 }}
          >
            <button 
              onClick={onViewFull}
              className="bg-[#ff950e] text-black font-medium py-1.5 px-3 rounded-lg transition-all transform hover:bg-[#ffaa2c] flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Full</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-[200px] sm:h-[250px] bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">Not provided</span>
        </div>
      )}
    </div>
  );
}
