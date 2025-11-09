// src/app/sellers/verify/page.tsx
'use client';

// Force dynamic rendering and no cache
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useRef, useCallback } from 'react';
import BanCheck from '@/components/BanCheck';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { verificationService } from '@/services/verification.service';

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
  const { user, isAuthReady, refreshSession } = useAuth();
  const router = useRouter();
  const isMountedRef = useRef(false);

  // State for verification status and documents
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const [code, setCode] = useState('');
  const [codePhoto, setCodePhoto] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [passport, setPassport] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<ImageViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Load verification status from backend
  const loadVerificationStatus = useCallback(async () => {
    if (!user || !isMountedRef.current) {
      setIsLoading(false);
      return;
    }

    console.log('[VerifyPage] Loading verification status for user:', user.username);

    try {
      // CRITICAL: Use the backend user verification status from AuthContext
      // The User model has these fields: isVerified, verificationStatus
      const backendStatus = user.verificationStatus || 'unverified';
      const isVerified = user.isVerified || false;

      console.log('[VerifyPage] User verification data:', {
        verificationStatus: backendStatus,
        isVerified: isVerified
      });

      // Determine the actual status to display
      let displayStatus: 'unverified' | 'pending' | 'verified' | 'rejected' = 'unverified';

      // Priority order: isVerified flag takes precedence
      if (isVerified) {
        displayStatus = 'verified';
      } else if (backendStatus === 'pending') {
        displayStatus = 'pending';
      } else if (backendStatus === 'rejected') {
        displayStatus = 'rejected';
      } else {
        displayStatus = 'unverified';
      }

      console.log('[VerifyPage] Display status:', displayStatus);

      // Get detailed status from verification service
      const result = await verificationService.getVerificationStatus();
      
      if (result.success && result.data) {
        console.log('[VerifyPage] Verification service data:', result.data);
        
        // FIXED: Only use service status if user is NOT verified
        // If isVerified is true, always show verified state regardless of service response
        if (!isVerified) {
          const serviceStatus = result.data.status as 'unverified' | 'pending' | 'verified' | 'rejected';
          
          // Map 'approved' to 'verified' for compatibility
          const mappedStatus = serviceStatus === 'approved' as any ? 'verified' : serviceStatus;
          
          if (isMountedRef.current) {
            setVerificationStatus(mappedStatus || displayStatus);
            
            if (result.data.rejectionReason) {
              setRejectionReason(result.data.rejectionReason);
            }
          }
        } else {
          // User is verified, use the display status (which is 'verified')
          if (isMountedRef.current) {
            setVerificationStatus(displayStatus);
            
            // Still get rejection reason if available (for history)
            if (result.data.rejectionReason) {
              setRejectionReason(result.data.rejectionReason);
            }
          }
        }
      } else {
        // Fallback to user's status from AuthContext
        if (isMountedRef.current) {
          setVerificationStatus(displayStatus);
        }
      }

      // Generate or retrieve verification code
      const storedCode = localStorage.getItem(`verification_code_${user.username}`);
      let nextCode: string;
      
      if (displayStatus === 'rejected' || !storedCode) {
        // Generate new code if rejected or no existing code
        nextCode = generateVerificationCode(user.username);
        localStorage.setItem(`verification_code_${user.username}`, nextCode);
      } else {
        nextCode = storedCode;
      }
      
      if (isMountedRef.current) {
        setCode(nextCode);
      }

      // Load stored documents if in pending/verified/rejected state
      if (displayStatus !== 'unverified') {
        const storedDocs = localStorage.getItem(`verification_docs_${user.username}`);
        if (storedDocs) {
          try {
            const docs = JSON.parse(storedDocs);
            if (isMountedRef.current) {
              setCodePhoto(docs.codePhoto || null);
              setIdFront(docs.idFront || null);
              setIdBack(docs.idBack || null);
              setPassport(docs.passport || null);
            }
          } catch (parseError) {
            console.error('[VerifyPage] Error parsing stored docs:', parseError);
          }
        }
      }
    } catch (err) {
      console.error('[VerifyPage] Error loading verification status:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load verification status');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Initialize verification status when auth is ready and user is available
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    loadVerificationStatus();
  }, [isAuthReady, user, loadVerificationStatus]);

  // Submit handler for unverified and rejected states
  const handleSubmit = useCallback(
    async (docs: any) => {
      if (!isMountedRef.current || !user) return;

      console.log('[VerifyPage] Submitting verification documents...');

      try {
        if (!docs || typeof docs !== 'object') throw new Error('Invalid verification documents');
        if (!docs.code || typeof docs.code !== 'string') throw new Error('Verification code is required');

        // Store documents locally for display
        localStorage.setItem(`verification_docs_${user.username}`, JSON.stringify(docs));
        
        // Submit to backend
        const result = await verificationService.submitVerification(docs);
        
        if (result.success) {
          console.log('[VerifyPage] Verification submitted successfully');
          
          // Update local state
          setVerificationStatus('pending');
          setCodePhoto(docs.codePhoto);
          setIdFront(docs.idFront || null);
          setIdBack(docs.idBack || null);
          setPassport(docs.passport || null);
          
          // Refresh user session to get updated verification status
          await refreshSession();
          
          // Redirect to profile after short delay
          setTimeout(() => {
            if (isMountedRef.current) {
              router.push('/sellers/profile');
            }
          }, 2000);
        } else {
          throw new Error(result.error?.message || 'Failed to submit verification');
        }
      } catch (err) {
        console.error('[VerifyPage] Error submitting verification:', err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to submit verification');
        }
        throw err; // Re-throw to let the component handle it
      }
    },
    [user, router, refreshSession]
  );

  // View image fullscreen
  const viewImage = useCallback((type: string, url: string | null) => {
    if (!url || typeof url !== 'string' || !isMountedRef.current) return;
    setCurrentImage({ type, url });
  }, []);

  const safeSetCurrentImage = useCallback((image: ImageViewData | null) => {
    if (isMountedRef.current) setCurrentImage(image);
  }, []);

  // Loading state
  if (!isAuthReady || isLoading) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
            <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-4" />
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

  // Not logged in
  if (!user) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl shadow-xl p-8 max-w-md w-full border border-gray-800">
            <Shield className="w-12 h-12 text-[#ff950e] mb-4 mx-auto" />
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

  console.log('[VerifyPage] Rendering state:', verificationStatus);

  // VERIFIED STATE
  if (verificationStatus === 'verified') {
    return (
      <BanCheck>
        <VerifiedState user={user} code={code} />
      </BanCheck>
    );
  }

  // PENDING STATE
  if (verificationStatus === 'pending') {
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
          <ImageViewerModal imageData={currentImage} onClose={() => safeSetCurrentImage(null)} />
        )}
      </BanCheck>
    );
  }

  // REJECTED STATE
  if (verificationStatus === 'rejected') {
    return (
      <BanCheck>
        <RejectedState 
          user={{
            ...user,
            verificationRejectionReason: rejectionReason
          }} 
          code={code} 
          onSubmit={handleSubmit} 
        />
      </BanCheck>
    );
  }

  // DEFAULT - UNVERIFIED STATE (First time)
  return (
    <BanCheck>
      <UnverifiedState user={user} code={code} onSubmit={handleSubmit} />
    </BanCheck>
  );
}
