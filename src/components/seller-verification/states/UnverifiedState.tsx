// src/components/seller-verification/states/UnverifiedState.tsx
'use client';

import { useState, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SecureForm } from '@/components/ui/SecureForm';
import VerificationStatusHeader from '../VerificationStatusHeader';
import VerificationCodeDisplay from '../VerificationCodeDisplay';
import VerificationBenefits from '../VerificationBenefits';
import VerificationInstructions from '../VerificationInstructions';
import DocumentUploadSection from '../DocumentUploadSection';
import { VerificationStateProps } from '../utils/types';
import { toBase64 } from '../utils/verificationHelpers';

interface UnverifiedStateProps extends VerificationStateProps {
  onSubmit: (docs: any) => void;
}

export default function UnverifiedState({ user, code, onSubmit }: UnverifiedStateProps) {
  const router = useRouter();
  
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  
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
        setValidationError(''); // Clear any previous errors
      } catch (error) {
        console.error("Error converting file:", error);
        setValidationError("Failed to process image. Please try again with a smaller file.");
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (!codePhoto || (!idFront && !passport)) {
      setValidationError('Please upload all required documents.');
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

    try {
      await onSubmit(docs);
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => router.push('/sellers/profile'), 2000);
    } catch (error) {
      setSubmitting(false);
      setValidationError('Failed to submit verification. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-gray-800">
          <VerificationStatusHeader status="unverified" title="Seller Verification" />
          
          <div className="p-6 sm:p-8">
            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Get Verified to Unlock Benefits</h2>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-gray-300 text-sm leading-relaxed flex-1">
                  Verified sellers gain more trust from buyers and can post up to 25 listings (vs just 2 for unverified sellers).
                  Complete the verification process below to get your account verified and receive your verification badge.
                </p>
                {/* Preview of the verification badge */}
                <div className="flex-shrink-0 w-20 h-20">
                  <img 
                    src="/verification_badge.png" 
                    alt="Verification Badge" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <VerificationBenefits />
            </div>
            
            {/* Verification Code */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Verification Steps</h3>
              
              <VerificationCodeDisplay code={code} />
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-[#ff950e] mb-2">2. Required Documents</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    A photo of yourself holding a paper with your verification code
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    Front of your driver's license or ID card (or passport)
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#ff950e] mr-2">•</span>
                    Back of your driver's license or ID card (if using license)
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Verification Instruction Image */}
            <VerificationInstructions />
            
            {/* Upload Form */}
            <SecureForm
              onSubmit={handleSubmit}
              rateLimitKey="verification_submit"
              rateLimitConfig={{ maxAttempts: 3, windowMs: 60 * 60 * 1000 }}
            >
              <div className="border-t border-gray-800 pt-6">
                <h3 className="font-medium text-white mb-4">Upload Verification Documents</h3>
                
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
                
                {/* Validation Error */}
                {validationError && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {validationError}
                    </p>
                  </div>
                )}
                
                {/* Help Text */}
                <div className="mt-6 bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
                  <h4 className="text-sm font-medium text-white flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 mr-2 text-[#ff950e]" />
                    Important Notes
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                    <li>• Your ID information is only used for verification purposes</li>
                    <li>• We take privacy seriously and your documents will be securely stored</li>
                    <li>• Verification usually takes 24-48 hours to complete</li>
                    <li>• Make sure all documents are clear and legible</li>
                  </ul>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !codePhoto || (!idFront && !passport)}
                    className={`flex-1 px-4 py-3 font-bold rounded-lg text-center transition ${
                      submitting || !codePhoto || (!idFront && !passport)
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Verification'}
                  </button>
                  <button
                    type="button"
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
            </SecureForm>
          </div>
        </div>
      </div>
    </div>
  );
}
