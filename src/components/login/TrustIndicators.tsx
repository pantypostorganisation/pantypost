// src/components/login/TrustIndicators.tsx
'use client';

import { TrustIndicatorsProps } from '@/types/login';

export default function TrustIndicators({}: TrustIndicatorsProps) {
  return (
    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600 transition-all duration-500">
      <span>🔒 Secure</span>
      <span>🛡️ Encrypted</span>
      <span>✓ Verified</span>
    </div>
  );
}