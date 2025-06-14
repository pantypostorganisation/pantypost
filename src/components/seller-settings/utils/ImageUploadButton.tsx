// src/components/seller-settings/utils/ImageUploadButton.tsx
'use client';

import { Upload } from 'lucide-react';
import { RefObject } from 'react';

interface ImageUploadButtonProps {
  onClick: () => void;
  text: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function ImageUploadButton({ 
  onClick, 
  text, 
  icon = <Upload className="w-4 h-4" />,
  className = "",
  disabled = false
}: ImageUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition disabled:bg-gray-600 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
      {text}
    </button>
  );
}
