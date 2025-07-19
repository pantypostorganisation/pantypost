// src/components/admin/verification/DocumentCard.tsx
'use client';

import { ExternalLink, ImageIcon } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull?: () => void;
}

export default function DocumentCard({ title, imageSrc, onViewFull }: DocumentCardProps) {
  const hasImage = imageSrc && imageSrc.trim() !== '';
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm uppercase text-gray-400 font-medium tracking-wider">
        {title}
      </h4>
      
      <div className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden aspect-[4/3]">
        {hasImage ? (
          <>
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={onViewFull}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            
            {/* Error fallback - hidden by default */}
            <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-xs text-center px-2">
                Failed to load image
              </span>
            </div>
            
            {/* Hover overlay - Added pointer-events-none to prevent click interference */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none"
            >
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs text-center px-2">
              Not provided
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
