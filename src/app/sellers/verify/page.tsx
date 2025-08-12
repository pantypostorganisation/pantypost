// src/app/sellers/verify/page.tsx
'use client';

// Force dynamic rendering and no cache
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef, useCallback } from 'react';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useListings, type VerificationDocs } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import Link from 'next/link';

// Verification components
import ImageViewerModal from '@/components/seller-verification/ImageViewerModal';
import VerifiedState from '@/components/seller-verification/states/VerifiedState';
import PendingState from '@/components/seller-verification/states/PendingState';
import RejectedState from '@/components/seller-verification/states/RejectedState';
import UnverifiedState from '@/components/seller-verification/states/UnverifiedState';
import type { ImageViewData } from '@/components/seller-verification/utils/types';
import { generateVerificationCode, getTimeAgo } from '@/components/seller-verification/utils/verificationHelpers';

// Client-only login button (prevents SSR router usage)
const LoginButton = () => {
  const router = useRouter();
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleClick = useCallback(() => {
    if (isMountedRef.current) router.push('/login');
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
  const isMountedRef = useRef(false);

  const [code, setCode] = useState('');
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Initialize code + existing docs
  useEffect(() => {
    // If auth context hasn't provided a user yet, let the UI show the login card
    if (!user) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        if (!user.username || typeof user.username !== 'string') {
          throw new Error('Invalid user data: missing or invalid username');
        }

        // Code: new each time if rejected; otherwise reuse or generate
        const userRecord = users?.[user.username];
        const existingCode = userRecord?.verificationDocs?.code;

        const nextCode =
          user.verificationStatus === 'rejected'
            ? generateVerificationCode(user.username)
            : (typeof existingCode === 'string' && existingCode) || generateVerificationCode(user.username);

        if (isMountedRef.current) setCode(nextCode);

        // Existing docs
        const docs = userRecord?.verificationDocs;
        if (docs && isMountedRef.current) {
          if (typeof docs.codePhoto === 'string') setCodePhoto(docs.codePhoto);
          if (typeof docs.idFront === 'string') setIdFront(docs.idFront);
          if (typeof docs.idBack === 'string') setIdBack(docs.idBack);
          if (typeof docs.passport === 'string') setPassport(docs.passport);
        }
      } catch (err) {
        console.error('Error initializing verification page:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to initialize verification page');
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    })();
  }, [user, users]);

  // Submit handler
  const handleSubmit = useCallback(
    async (docs: VerificationDocs) => {
      if (!isMountedRef.current || !user) return;

      try {
        if (!docs || typeof docs !== 'object') throw new Error('Invalid verification documents');
        if (!docs.code || typeof docs.code !== 'string') throw new Error('Verification code is required');

        await requestVerification(docs);
      } catch (err) {
        console.error('Error submitting verification:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to submit verification');
        }
      }
    },
    [user, requestVerification]
  );

  // View image fullscreen
  const viewImage = useCallback((type: string, url: string | null) => {
    if (!url || typeof url !== 'string' || !isMountedRef.current) return;
    setCurrentImage({ type, url });
  }, []);

  const safeSetCurrentImage = useCallback((image: ImageViewData | null) => {
    if (isMountedRef.current) setCurrentImage(image);
  }, []);

  // Loading
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

  // Error
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

  // Not logged in
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

  // Logged in but wrong role
  if (user.role !== 'seller') {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800 text-center">
            <Shield className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
            <h1 className="text-2xl font-bold mb-2">Sellers Only</h1>
            <p className="text-gray-400 mb-6">
              This page is for sellers who want to verify their account.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </BanCheck>
    );
  }

  // VERIFIED
  if (user.verificationStatus === 'verified') {
    return (
      <BanCheck>
        <VerifiedState user={user} code={code} />
      </BanCheck>
    );
  }

  // PENDING
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
          // If your PendingState supports an image viewer callback, you can pass:
          // onViewImage={viewImage}
        />
        {currentImage && (
          <ImageViewerModal imageData={currentImage} onClose={() => safeSetCurrentImage(null)} />
        )}
      </BanCheck>
    );
  }

  // REJECTED
  if (user.verificationStatus === 'rejected') {
    return (
      <BanCheck>
        <RejectedState user={user} code={code} onSubmit={handleSubmit} />
      </BanCheck>
    );
  }

  // DEFAULT (unverified first-time)
  return (
    <BanCheck>
      <UnverifiedState user={user} code={code} onSubmit={handleSubmit} />
    </BanCheck>
  );
}
