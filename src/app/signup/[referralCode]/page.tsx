// src/app/signup/[referralCode]/page.tsx - NEW FILE for referral code URLs
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { referralService } from '@/services/referral.service';
import SignupPageContent from '../SignupPageContent';

export default function ReferralSignupPage() {
  const params = useParams();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrerInfo, setReferrerInfo] = useState<{ username: string; profilePic?: string } | null>(null);
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
        setReferralCode(response.data.code);
        setReferrerInfo(response.data.referrer);
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

  return (
    <SignupPageContent 
      initialReferralCode={referralCode}
      referrerInfo={referrerInfo}
    />
  );
}
