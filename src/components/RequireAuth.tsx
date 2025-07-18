// src/components/RequireAuth.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sanitizeStrict } from '@/utils/security/sanitization';

const VALID_ROLES = ['buyer', 'seller', 'admin'] as const;
type ValidRole = typeof VALID_ROLES[number];

// Admin usernames stored as constants to prevent tampering
const ADMIN_USERNAMES = ['oakley', 'gerome'] as const;

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
    // Skip if auth is not ready - WAIT for it to be ready
    if (!isAuthReady) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[RequireAuth] Waiting for auth to be ready...');
      }
      return;
    }

    // Only check once when auth becomes ready
    if (hasChecked) return;

    // Validate the role parameter
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
      console.log('[RequireAuth] Current user:', user ? { 
        username: '***',
        role: user.role 
      } : 'No user');
    }

    const userRole = user?.role;
    
    // Sanitize username before comparison
    const sanitizedUsername = user?.username ? sanitizeStrict(user.username).toLowerCase() : '';
    const isAdmin = ADMIN_USERNAMES.includes(sanitizedUsername as typeof ADMIN_USERNAMES[number]);

    // Special handling for admin users
    if (role === 'admin') {
      const hasAccess = isAdmin;
      if (!hasAccess) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RequireAuth] Admin access denied, redirecting to login');
        }
        router.push('/login');
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RequireAuth] Admin access granted');
        }
        setAuthorized(true);
      }
    } else {
      // For buyer/seller pages
      const isValidUserRole = userRole && VALID_ROLES.includes(userRole as ValidRole);
      
      // Allow access if role matches OR if user is admin
      const hasAccess = user && isValidUserRole && (userRole === role || isAdmin);
      
      if (!hasAccess) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RequireAuth] Access denied, redirecting to login');
        }
        router.push('/login');
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[RequireAuth] Access granted');
        }
        setAuthorized(true);
      }
    }
    
    setHasChecked(true);
  }, [isAuthReady, user, role, router, hasChecked]);

  // IMPORTANT: Always show loading while auth is not ready
  // This prevents the component from redirecting before auth state is loaded
  if (!isAuthReady) {
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

  // Also show loading while auth check is in progress
  if (!hasChecked) {
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
