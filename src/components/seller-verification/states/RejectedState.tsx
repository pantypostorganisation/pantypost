// src/components/seller-verification/states/RejectedState.tsx
'use client';

import { useState, useRef } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import VerificationStatusHeader from '../VerificationStatusHeader';
import VerificationCodeDisplay from '../VerificationCodeDisplay';
import VerificationInstructions from '../VerificationInstructions';
import DocumentUploadSection from '../DocumentUploadSection';
import { VerificationStateProps } from '../utils/types';
import { toBase64 } from '../utils/verificationHelpers';

interface RejectedStateProps extends VerificationStateProps {
  onSubmit: (docs: any) => void;
}

export default function RejectedState({ user, code, onSubmit }: RejectedStateProps) {
  const router = useRouter();
  
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const codePhotoInputRef = useRef<HTMLInputElement>(null);
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await toBase64(file);
        setter(base64);
      } catch (error) {
        console.error("Error converting file:", error);
        alert("Failed to process image. Please try again with a smaller file.");
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codePhoto || (!idFront && !passport)) {
      alert('Please upload all required documents.');
      return;
    }
    setSubmitting(true);

    const docs = {
      code,
      codePhoto,
      idFront: idFront || undefined,
      idBack: idBack || undefined,
      passport: passport || undefined,
    };

    onSubmit(docs);
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push('/sellers/profile'), 2000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-red-800">
          <VerificationStatusHeader status="rejected" title="Verification Status" />
          
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="w-20 h-20 bg-red-900 bg-opacity-30 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Rejected</h2>
              <p className="text-red-400 font-medium">Your verification request was not approved</p>
            </div>
            
            {/* Rejection Reason */}
            <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 my-4">
              <h3 className="text-red-400 font-medium mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Reason for Rejection
              </h3>
              <p className="text-gray-300 text-sm">
                {user.verificationRejectionReason || "Your verification documents did not meet our requirements. Please review and submit again."}
              </p>
            </div>
            
            {/* New verification code */}
            <VerificationCodeDisplay 
              code={code}
              title="Your New Verification Code"
              description="You must use this new code in your verification photo"
              showRefreshIcon
            />
            
            {/* Verification Instruction Image */}
            <VerificationInstructions />
            
            {/* Upload Form */}
            <div className="mt-4">
              <h3 className="font-medium text-white mb-4">Upload New Documents</h3>
              
              <DocumentUploadSection
                codePhoto={codePhoto}
                idFront={idFront}
                idBack={idBack}
                passport={passport}
                onCodePhotoChange={(e) => handleFileChange(e, setCodePhoto)}
                onIdFrontChange={(e) => handleFileChange(e, setIdFront)}
                onIdBackChange={(e) => handleFileChange(e, setIdBack)}
                onPassportChange={(e) => handleFileChange(e, setPassport)}
                codePhotoRef={codePhotoInputRef}
                idFrontRef={idFrontInputRef}
                idBackRef={idBackInputRef}
                passportRef={passportInputRef}
              />
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !codePhoto || (!idFront && !passport)}
                  className={`flex-1 px-4 py-3 font-bold rounded-lg text-center transition ${
                    submitting || !codePhoto || (!idFront && !passport)
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit New Verification'}
                </button>
                <button
                  onClick={() => router.push('/sellers/profile')}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
                >
                  Back to Profile
                </button>
              </div>
              
              {submitted && (
                <p className="text-green-500 text-center mt-4">
                  ✅ Verification submitted successfully! Redirecting...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
