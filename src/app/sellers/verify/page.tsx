// src/app/sellers/verify/page.tsx
'use client';

// Add these exports to force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef, useCallback } from 'react';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useListings, VerificationDocs } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import Link from 'next/link';

// Import verification components
import ImageViewerModal from '@/components/seller-verification/ImageViewerModal';
import VerifiedState from '@/components/seller-verification/states/VerifiedState';
import PendingState from '@/components/seller-verification/states/PendingState';
import RejectedState from '@/components/seller-verification/states/RejectedState';
import UnverifiedState from '@/components/seller-verification/states/UnverifiedState';
import { ImageViewData } from '@/components/seller-verification/utils/types';
import { generateVerificationCode, getTimeAgo } from '@/components/seller-verification/utils/verificationHelpers';

// Client component for the login button to avoid SSR issues
const LoginButton = () => {
  const router = useRouter();
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleClick = useCallback(() => {
    if (isMountedRef.current) {
      router.push('/login');
    }
  }, [router]);
  
  return (
    <button
      onClick={handleClick}
      className="mt-6 px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition w-full"
    >
      Log In
    </button>
  );
};

export default function SellerVerifyPage() {
  const { user } = useAuth();
  const { requestVerification, users } = useListings();
  const isMountedRef = useRef(true);

  const [code, setCode] = useState('');
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate or load unique code for this seller
  useEffect(() => {
    if (!user || !isMountedRef.current) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Validate user object structure
      if (!user.username || typeof user.username !== 'string') {
        throw new Error('Invalid user data: missing or invalid username');
      }
      
      // If user is rejected, always generate a new code
      if (user.verificationStatus === 'rejected') {
        const newCode = generateVerificationCode(user.username);
        if (isMountedRef.current) {
          setCode(newCode);
        }
      } else {
        // For non-rejected users, check for existing code
        const userRecord = users && users[user.username];
        const existing = userRecord?.verificationDocs?.code;
        
        if (existing && typeof existing === 'string') {
          if (isMountedRef.current) {
            setCode(existing);
          }
        } else {
          // Generate new 8-digit code
          const newCode = generateVerificationCode(user.username);
          if (isMountedRef.current) {
            setCode(newCode);
          }
        }
      }
      
      // Load existing documents if available
      if (users && users[user.username]?.verificationDocs && isMountedRef.current) {
        const docs = users[user.username].verificationDocs;
        if (docs?.codePhoto && typeof docs.codePhoto === 'string') {
          setCodePhoto(docs.codePhoto);
        }
        if (docs?.idFront && typeof docs.idFront === 'string') {
          setIdFront(docs.idFront);
        }
        if (docs?.idBack && typeof docs.idBack === 'string') {
          setIdBack(docs.idBack);
        }
        if (docs?.passport && typeof docs.passport === 'string') {
          setPassport(docs.passport);
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing verification page:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize verification page');
      setIsLoading(false);
    }
  }, [user, users]);

  // Safe submit handler with error handling
  const handleSubmit = useCallback(async (docs: VerificationDocs) => {
    if (!isMountedRef.current || !user) {
      console.warn('Cannot submit verification: component unmounted or user not available');
      return;
    }
    
    try {
      // Validate docs before submission
      if (!docs || typeof docs !== 'object') {
        throw new Error('Invalid verification documents');
      }
      
      if (!docs.code || typeof docs.code !== 'string') {
        throw new Error('Verification code is required');
      }
      
      await requestVerification(docs);
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit verification');
    }
  }, [user, requestVerification]);

  // Function to view an image fullscreen
  const viewImage = useCallback((type: string, url: string | null) => {
    if (!url || !isMountedRef.current || typeof url !== 'string') {
      return;
    }
    
    setCurrentImage({ type, url });
  }, []);

  // Safe state update wrapper
  const safeSetCurrentImage = useCallback((image: ImageViewData | null) => {
    if (isMountedRef.current) {
      setCurrentImage(image);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
            <div className="w-8 h-8 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-center">Loading verification page...</p>
          </div>
        </div>
      </BanCheck>
    );
  }

  // Error state
  if (error) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
            <Shield className="w-12 h-12 text-red-500 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold mb-4 text-center">Error</h1>
            <p className="text-gray-400 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
            <Shield className="w-12 h-12 text-[#ff950e] mb-4" />
            <h1 className="text-2xl font-bold mb-4">Seller Verification</h1>
            <p className="text-gray-400">You must be logged in as a seller to access this page.</p>
            <LoginButton />
          </div>
        </div>
      </BanCheck>
    );
  }

  // VERIFIED STATE
  if (user.verificationStatus === 'verified') {
    return (
      <BanCheck>
        <VerifiedState user={user} code={code} />
      </BanCheck>
    );
  }

  // PENDING STATE
  if (user.verificationStatus === 'pending') {
    return (
      <BanCheck>
        <PendingState 
          user={user} 
          code={code}
          codePhoto={codePhoto || undefined}
          idFront={idFront || undefined}
          idBack={idBack || undefined}
          passport={passport || undefined}
          getTimeAgo={getTimeAgo}
        />
        {currentImage && (
          <ImageViewerModal 
            imageData={currentImage}
            onClose={() => safeSetCurrentImage(null)}
          />
        )}
      </BanCheck>
    );
  }

  // REJECTED STATE
  if (user.verificationStatus === 'rejected') {
    return (
      <BanCheck>
        <RejectedState 
          user={user} 
          code={code}
          onSubmit={handleSubmit}
        />
      </BanCheck>
    );
  }

  // DEFAULT STATE - Unverified first time
  return (
    <BanCheck>
      <UnverifiedState 
        user={user} 
        code={code}
        onSubmit={handleSubmit}
      />
    </BanCheck>
  );
}