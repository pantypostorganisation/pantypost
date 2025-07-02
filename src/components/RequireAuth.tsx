// src/components/RequireAuth.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    // Skip if auth is not ready
    if (!isAuthReady) {
      console.log('[RequireAuth] Waiting for auth to be ready...');
      return;
    }

    // Only check once when auth becomes ready
    if (hasChecked) return;

    console.log('[RequireAuth] Auth ready, checking access for role:', role);
    console.log('[RequireAuth] Current user:', user ? { 
      username: user.username, 
      role: user.role 
    } : 'No user');

    const userRole = user?.role;
    const isAdmin = userRole === 'admin';

    // Allow access if role matches or if admin accessing buyer/seller page
    const hasAccess = user && (userRole === role || (role !== 'admin' && isAdmin));
    
    if (!hasAccess) {
      console.log('[RequireAuth] Access denied, redirecting to login');
      // Small delay to prevent flash of content
      setTimeout(() => {
        router.push('/login');
      }, 100);
    } else {
      console.log('[RequireAuth] Access granted');
      setAuthorized(true);
    }
    
    setHasChecked(true);
  }, [isAuthReady, user, role, router, hasChecked]);

  // Show loading state while checking auth
  if (!isAuthReady || (!authorized && !hasChecked)) {
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