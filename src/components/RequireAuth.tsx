'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sanitizeStrict } from '@/utils/security/sanitization';

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
    if (!isAuthReady || hasChecked) return;

    // Validate the role parameter
    if (!VALID_ROLES.includes(role as ValidRole)) {
      router.push('/login');
      setHasChecked(true);
      return;
    }

    const userRole = user?.role;
    const sanitizedUsername = user?.username ? sanitizeStrict(user.username).toLowerCase() : '';

    // NEW: strict role matching — no admin override for buyer/seller
    let hasAccess = false;
    if (role === 'admin') {
      hasAccess = userRole === 'admin';
    } else {
      hasAccess = userRole === role; // admin can’t view buyer/seller pages
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
