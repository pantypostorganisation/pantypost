// src/components/signup/TermsCheckboxes.tsx
'use client';

import Link from 'next/link';
import { TermsCheckboxesProps } from '@/types/signup';

export default function TermsCheckboxes({
  termsAccepted,
  ageVerified,
  termsError,
  ageError,
  onTermsChange,
  onAgeChange
}: TermsCheckboxesProps) {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-start">
        <input
          id="termsAccepted"
          name="termsAccepted"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111]"
        />
        <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-300">
          I agree to the{' '}
          <Link href="/terms" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
            Terms and Conditions
          </Link>
        </label>
      </div>
      {termsError && (
        <p className="mt-0.5 text-xs text-red-400 pl-7">{termsError}</p>
      )}
      
      <div className="flex items-start">
        <input
          id="ageVerified"
          name="ageVerified"
          type="checkbox"
          checked={ageVerified}
          onChange={(e) => onAgeChange(e.target.checked)}
          className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111]"
        />
        <label htmlFor="ageVerified" className="ml-3 block text-sm text-gray-300">
          I confirm that I am at least 21 years old
        </label>
      </div>
      {ageError && (
        <p className="mt-0.5 text-xs text-red-400 pl-7">{ageError}</p>
      )}
    </div>
  );
}