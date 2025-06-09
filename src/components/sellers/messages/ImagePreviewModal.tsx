// src/components/sellers/messages/ImagePreviewModal.tsx
'use client';

import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const [zoom, setZoom] = React.useState(1);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Image */}
      <motion.img
        initial={{ scale: 0.9 }}
        animate={{ scale: zoom }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-full object-contain cursor-zoom-out"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${zoom})` }}
      />
    </motion.div>
  );
};

export default ImagePreviewModal;