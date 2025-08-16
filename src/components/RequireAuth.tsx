'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canAccessRole, isAdmin } from '@/utils/security/permissions';

const VALID_ROLES = ['buyer', 'seller', 'admin'] as const;
type ValidRole = typeof VALID_ROLES[number];

export default function RequireAuth({
  role,
  children,
}: {
  role: 'buyer' | 'seller' | 'admin';
  children: React.ReactNode;
}) {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready
    if (!isAuthReady) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RequireAuth] Waiting for auth to be ready...');
      }
      return;
    }
    if (hasChecked) return;

    // Validate role prop
    if (!VALID_ROLES.includes(role as ValidRole)) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[RequireAuth] Invalid role:', role);
      }
      router.push('/login');
      setHasChecked(true);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[RequireAuth] Auth ready, checking access for role:', role);
      console.log('[RequireAuth] Current user:', user ? { username: '***', role: user.role } : 'No user');
    }

    // Access logic: admins can access anything; otherwise must match required role
    const hasAccess = !!user && canAccessRole(user, role);

    if (!hasAccess) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[RequireAuth] Access denied (required=${role}, userRole=${user?.role}). Redirecting to login.`
        );
      }
      router.push('/login');
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[RequireAuth] Access granted (required=${role}, userRole=${user?.role}, isAdmin=${isAdmin(user)})`
        );
      }
      setAuthorized(true);
    }

    setHasChecked(true);
  }, [isAuthReady, user, role, router, hasChecked]);

  // Loading states
  if (!isAuthReady || !hasChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-[#ff950e] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  if (!authorized) return null;
  return <>{children}</>;
}
