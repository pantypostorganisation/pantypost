// src/components/signup/PasswordStrength.tsx
'use client';

import { PasswordStrengthProps } from '@/types/signup';
import { getPasswordStrengthColor, getPasswordStrengthText } from '@/utils/signupUtils';

export default function PasswordStrength({ password, strength }: PasswordStrengthProps) {
  if (!password) return null;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-500">Password strength</span>
        <span className={`font-medium ${
          strength < 30 ? 'text-red-400' :
          strength < 60 ? 'text-yellow-400' :
          strength < 90 ? 'text-blue-400' :
          'text-green-400'
        }`}>
          {getPasswordStrengthText(strength)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getPasswordStrengthColor(strength)}`}
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
}