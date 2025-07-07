// src/components/login/UsernameStep.tsx

'use client';

import { ArrowRight } from 'lucide-react';
import { UsernameStepProps } from '@/types/login';
import { SecureInput } from '@/components/ui/SecureInput';
import { SecureForm } from '@/components/ui/SecureForm';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';

export default function UsernameStep({
  username,
  error,
  onUsernameChange,
  onSubmit,
  onKeyPress,
  isDisabled
}: UsernameStepProps) {
  
  // Handle username change with sanitization
  const handleUsernameChange = (value: string) => {
    // Sanitize the username input
    const sanitizedValue = sanitizeUsername(value);
    onUsernameChange(sanitizedValue);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="transition-all duration-300">
      <SecureForm
        onSubmit={handleSubmit}
        rateLimitKey="login_username"
        rateLimitConfig={RATE_LIMITS.LOGIN}
      >
        <div className="mb-6">
          <SecureInput
            id="username"
            type="text"
            label="Username"
            value={username}
            onChange={handleUsernameChange}
            onKeyDown={onKeyPress}
            placeholder="Enter your username"
            error={error}
            sanitize={true}
            sanitizer={sanitizeUsername}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: isDisabled ? undefined : '#000' }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </SecureForm>
    </div>
  );
}
