// src/components/RequireAuth.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const VALID_ROLES = ['buyer', 'seller', 'admin'] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const RoleSchema = z.enum(VALID_ROLES);

interface RequireAuthProps {
  role: ValidRole;
  children: React.ReactNode;
  allowGuest?: boolean; // New prop to allow guest access
}

export default function RequireAuth({
  role,
  children,
  allowGuest = false,
}: RequireAuthProps) {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!isAuthReady || hasChecked) return;

    // Check if this is the browse page and guest access is allowed
    const isBrowsePage = pathname === '/browse';
    if (isBrowsePage && allowGuest) {
      setAuthorized(true);
      setHasChecked(true);
      return;
    }

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
      hasAccess = userRole === parsed.data; // admin can't view buyer/seller pages
    }

    if (!user || !hasAccess) {
      // If guest access is allowed and no user, still allow access
      if (allowGuest) {
        setAuthorized(true);
      } else {
        router.push('/login');
      }
    } else {
      setAuthorized(true);
    }

    setHasChecked(true);
  }, [isAuthReady, user, role, router, hasChecked, allowGuest, pathname]);

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
