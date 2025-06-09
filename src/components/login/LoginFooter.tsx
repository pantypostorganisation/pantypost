// src/components/login/LoginFooter.tsx
'use client';

import Link from 'next/link';
import { LoginFooterProps } from '@/types/login';

export default function LoginFooter({ step }: LoginFooterProps) {
  return (
    <div className="text-center mt-6 transition-all duration-500">
      <p className="text-base text-gray-500">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}