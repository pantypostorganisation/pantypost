// src/components/seller-verification/ImageViewerModal.tsx
'use client';

import { XCircle } from 'lucide-react';
import { ImageViewData } from './utils/types';

interface ImageViewerModalProps {
  imageData: ImageViewData | null;
  onClose: () => void;
}

export default function ImageViewerModal({ imageData, onClose }: ImageViewerModalProps) {
  if (!imageData) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="max-w-3xl max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={onClose}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
          <span className="text-sm text-white">{imageData.type}</span>
        </div>
        <img 
          src={imageData.url} 
          alt={imageData.type} 
          className="max-h-[90vh] max-w-full object-contain"
        />
      </div>
    </div>
  );
}
