// src/app/signup/[referralCode]/page.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { referralService } from '@/services/referral.service';

export default function ReferralSignupPage() {
  const params = useParams();
  const router = useRouter();
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateReferralCode();
  }, [params.referralCode]);

  const validateReferralCode = async () => {
    if (!params.referralCode) {
      router.push('/signup');
      return;
    }

    const code = params.referralCode as string;
    
    try {
      setValidating(true);
      const response = await referralService.validateReferralCode(code);
      
      if (response.success && response.data?.valid) {
        // Redirect to main signup page with referral code as URL param
        router.push(`/signup?ref=${encodeURIComponent(code)}`);
      } else {
        setError('Invalid or expired referral code');
        setTimeout(() => {
          router.push('/signup');
        }, 3000);
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setError('Failed to validate referral code');
      setTimeout(() => {
        router.push('/signup');
      }, 3000);
    } finally {
      setValidating(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Validating referral code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-gray-400 text-sm">Redirecting to signup page...</p>
        </div>
      </div>
    );
  }

  // This should not render as we redirect in validateReferralCode
  return null;
}
