// src/components/signup/TermsCheckboxes.tsx
'use client';

import Link from 'next/link';
import { TermsCheckboxesProps } from '@/types/signup';
import { SecureMessageDisplay, SecureLink } from '@/components/ui/SecureMessageDisplay';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function TermsCheckboxes({
  termsAccepted,
  ageVerified,
  termsError,
  ageError,
  onTermsChange,
  onAgeChange
}: TermsCheckboxesProps) {
  // Secure checkbox handlers
  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onTermsChange(checked);
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onAgeChange(checked);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Terms Checkbox */}
      <div>
        <div className="flex items-start">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            checked={termsAccepted}
            onChange={handleTermsChange}
            aria-describedby={termsError ? "terms-error" : undefined}
            className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111] cursor-pointer"
          />
          <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-300 cursor-pointer select-none">
            I agree to the{' '}
            <SecureLink 
              href="/terms" 
              className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors underline-offset-2 hover:underline"
              external={false}
            >
              Terms and Conditions
            </SecureLink>
            {termsAccepted && (
              <CheckCircle className="inline-block w-3 h-3 ml-1 text-green-500" />
            )}
          </label>
        </div>
        {termsError && (
          <p id="terms-error" className="mt-1 text-xs text-red-400 pl-7 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <SecureMessageDisplay content={termsError} allowBasicFormatting={false} />
          </p>
        )}
      </div>
      
      {/* Age Verification Checkbox */}
      <div>
        <div className="flex items-start">
          <input
            id="ageVerified"
            name="ageVerified"
            type="checkbox"
            checked={ageVerified}
            onChange={handleAgeChange}
            aria-describedby={ageError ? "age-error" : undefined}
            className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111] cursor-pointer"
          />
          <label htmlFor="ageVerified" className="ml-3 block text-sm text-gray-300 cursor-pointer select-none">
            I confirm that I am at least 21 years old
            {ageVerified && (
              <CheckCircle className="inline-block w-3 h-3 ml-1 text-green-500" />
            )}
          </label>
        </div>
        {ageError && (
          <p id="age-error" className="mt-1 text-xs text-red-400 pl-7 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <SecureMessageDisplay content={ageError} allowBasicFormatting={false} />
          </p>
        )}
      </div>

      {/* Security Note */}
      {(termsAccepted || ageVerified) && (
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-400 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Your data is protected and will never be shared with third parties
          </p>
        </div>
      )}

      {/* Legal Notice */}
      <p className="text-xs text-gray-500 mt-2">
        By creating an account, you acknowledge that this platform is for adults only and contains mature content.
      </p>
    </div>
  );
}
