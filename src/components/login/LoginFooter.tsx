// src/components/login/LoginFooter.tsx
'use client';

import Link from 'next/link';
import { LoginFooterProps } from '@/types/login';

export default function LoginFooter({ step }: LoginFooterProps) {
  return (
    <div className="text-center mt-6 space-y-3 transition-all duration-500">
      {/* Forgot Password - show on all steps */}
      <p className="text-sm">
        <Link href="/forgot-password" className="text-gray-400 hover:text-[#ff950e] transition-colors">
          Forgot password?
        </Link>
      </p>
      
      {/* Sign Up Link */}
      <p className="text-base text-gray-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}