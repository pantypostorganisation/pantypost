// src/components/signup/PasswordStrength.tsx
'use client';

import { PasswordStrengthProps } from '@/types/signup';
import { getPasswordStrengthColor, getPasswordStrengthText } from '@/utils/signupUtils';

function clamp01To100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export default function PasswordStrength({ password, strength }: PasswordStrengthProps) {
  if (!password) return null;

  const pct = clamp01To100(strength);

  return (
    <div className="mb-4" aria-live="polite">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-500">Password strength</span>
        <span
          className={`font-medium ${
            pct < 30 ? 'text-red-400' : pct < 60 ? 'text-yellow-400' : pct < 90 ? 'text-blue-400' : 'text-green-400'
          }`}
        >
          {getPasswordStrengthText(pct)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getPasswordStrengthColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
