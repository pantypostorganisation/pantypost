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

  useEffect(() => {
    let isMounted = true;

    if (!isAuthReady) return;

    const userRole = user?.role;
    const isAdmin = userRole === 'admin';

    // Allow access if role matches or if admin accessing buyer/seller page
    const hasAccess = user && (userRole === role || (role !== 'admin' && isAdmin));
    
    if (!hasAccess) {
      router.push('/login');
    } else if (isMounted) {
      setAuthorized(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, user, role, router]);

  // Show loading state while checking auth
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

  if (!authorized) return null;

  return <>{children}</>;
}
