// src/components/RequireAuth.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const VALID_ROLES = ['buyer', 'seller', 'admin'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const RoleSchema = z.enum(VALID_ROLES);

export default function RequireAuth({
  role,
  children,
}: {
  role: ValidRole;
  children: React.ReactNode;
}) {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isAuthReady || hasChecked) return;

    // Runtime validation of `role` prop (dev-only noise)
    const parsed = RoleSchema.safeParse(role);
    if (!parsed.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[RequireAuth] Invalid role prop supplied:', role);
      }
      router.push('/login');
      setHasChecked(true);
      return;
    }

    const userRole = user?.role as ValidRole | undefined;

    // NEW: strict role matching — no admin override for buyer/seller routes
    let hasAccess = false;
    if (parsed.data === 'admin') {
      hasAccess = userRole === 'admin';
    } else {
      hasAccess = userRole === parsed.data; // admin can’t view buyer/seller pages
    }

    if (!user || !hasAccess) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }

    setHasChecked(true);
  }, [isAuthReady, user, role, router, hasChecked]);

  if (!isAuthReady || !hasChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-label="Checking access">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" />
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
