// src/components/seller-verification/DocumentPreviewGrid.tsx
'use client';

import { ExternalLink } from 'lucide-react';
import { VerificationDocsDisplay } from './utils/types';

interface DocumentPreviewGridProps {
  documents: VerificationDocsDisplay;
  onViewImage: (type: string, url: string) => void;
}

export default function DocumentPreviewGrid({ documents, onViewImage }: DocumentPreviewGridProps) {
  const renderDocumentPreview = (doc: string | undefined, type: string, label: string) => {
    if (!doc) return null;
    
    return (
      <div className="relative border border-gray-800 rounded-lg overflow-hidden">
        <img 
          src={doc} 
          alt={label} 
          className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
          onClick={() => onViewImage(label, doc)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center pointer-events-none">
          <ExternalLink className="w-6 h-6 text-white opacity-70" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1.5 text-xs">
          {type}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {renderDocumentPreview(documents.codePhoto, "Photo with Code", "Photo with Verification Code")}
      {renderDocumentPreview(documents.idFront, "ID Front", "ID Front")}
      {renderDocumentPreview(documents.idBack, "ID Back", "ID Back")}
      {renderDocumentPreview(documents.passport, "Passport", "Passport")}
    </div>
  );
}
