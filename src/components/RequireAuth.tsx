'use client';

import { useListings } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RequireAuth({
  role,
  children,
}: {
  role: 'buyer' | 'seller' | 'admin';
  children: React.ReactNode;
}) {
  const { user, isAuthReady } = useListings();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  let isMounted = true;

  useEffect(() => {
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

  if (!isAuthReady || !authorized) return null;

  return <>{children}</>;
}