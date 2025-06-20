// src/components/seller-verification/states/PendingState.tsx
'use client';

import { useState } from 'react';
import { Clock, CalendarClock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import VerificationStatusHeader from '../VerificationStatusHeader';
import DocumentPreviewGrid from '../DocumentPreviewGrid';
import ImageViewerModal from '../ImageViewerModal';
import { VerificationStateProps, ImageViewData } from '../utils/types';

interface PendingStateProps extends VerificationStateProps {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
}

export default function PendingState({ 
  user, 
  code, 
  codePhoto,
  idFront,
  idBack,
  passport,
  getTimeAgo 
}: PendingStateProps) {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState<ImageViewData | null>(null);
  
  const viewImage = (type: string, url: string) => {
    setCurrentImage({ type, url });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-yellow-800">
          <VerificationStatusHeader status="pending" title="Verification Status" />
          
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <div className="w-20 h-20 bg-yellow-900 bg-opacity-30 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
              <p className="text-yellow-400 font-medium">Your verification is being reviewed by our team</p>
              <p className="text-sm text-gray-400 mt-2">
                Requested {getTimeAgo && user.verificationRequestedAt ? getTimeAgo(user.verificationRequestedAt) : 'recently'}
              </p>
              
              <div className="mt-8 border-t border-gray-800 pt-6 w-full">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                  <span>Verification Status:</span>
                  <span className="px-3 py-1 bg-yellow-900 text-yellow-400 rounded-full text-xs font-medium">
                    Pending Review
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                  <span>Verification Code:</span>
                  <span className="font-mono bg-black px-2 py-1 rounded text-yellow-500">{code}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Estimated Time:</span>
                  <span>24-48 hours</span>
                </div>
              </div>
            </div>
            
            {/* Document Preview */}
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h3 className="font-medium text-gray-300 mb-4 flex items-center">
                <CalendarClock className="w-4 h-4 mr-2 text-yellow-500" />
                Submitted Documents
              </h3>
              
              <DocumentPreviewGrid 
                documents={{ codePhoto, idFront, idBack, passport }}
                onViewImage={viewImage}
              />
            </div>
            
            <div className="rounded-lg bg-[#1a1a1a] border border-gray-800 p-4 mt-6">
              <h3 className="font-medium text-white flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                What happens next?
              </h3>
              <p className="text-sm text-gray-300">
                Our admin team will review your documents and either approve or reject your verification request. You'll receive a notification once the review is complete.
              </p>
            </div>
            
            <div className="mt-8">
              <button
                onClick={() => router.push('/sellers/profile')}
                className="w-full px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ImageViewerModal 
        imageData={currentImage}
        onClose={() => setCurrentImage(null)}
      />
    </div>
  );
}
