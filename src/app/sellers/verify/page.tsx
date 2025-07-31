// src/app/sellers/verify/page.tsx
'use client';

// Add these exports to force dynamic rendering
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef } from 'react';
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleClick = () => {
    if (isMountedRef.current) {
      router.push('/login');
    }
  };
  
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

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate or load unique code for this seller
  useEffect(() => {
    if (!user || !isMountedRef.current) return;
    
    // If user is rejected, always generate a new code
    if (user.verificationStatus === 'rejected') {
      const newCode = generateVerificationCode(user.username);
      if (isMountedRef.current) {
        setCode(newCode);
      }
    } else {
      // For non-rejected users, check for existing code
      const existing = users[user.username]?.verificationDocs?.code;
      if (existing) {
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
    if (users[user.username]?.verificationDocs && isMountedRef.current) {
      const docs = users[user.username].verificationDocs;
      if (docs?.codePhoto) setCodePhoto(docs.codePhoto);
      if (docs?.idFront) setIdFront(docs.idFront);
      if (docs?.idBack) setIdBack(docs.idBack);
      if (docs?.passport) setPassport(docs.passport);
    }
  }, [user, users]);

  const handleSubmit = (docs: VerificationDocs) => {
    if (isMountedRef.current) {
      requestVerification(docs);
    }
  };

  // Function to view an image fullscreen
  const viewImage = (type: string, url: string | null) => {
    if (!url || !isMountedRef.current) return;
    setCurrentImage({ type, url });
  };

  // Safe state update wrapper
  const safeSetCurrentImage = (image: ImageViewData | null) => {
    if (isMountedRef.current) {
      setCurrentImage(image);
    }
  };

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
        <ImageViewerModal 
          imageData={currentImage}
          onClose={() => safeSetCurrentImage(null)}
        />
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