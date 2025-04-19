'use client';

import { useListings } from '@/context/ListingContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({
  role,
  children,
}: {
  role: 'buyer' | 'seller' | 'admin';
  children: React.ReactNode;
}) {
  const { user, isAuthReady } = useListings();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady) {
      const userRole = user?.role;

      // ✅ Allow access if user is the correct role or is admin
      const hasAccess =
        userRole === role || (role !== 'admin' && userRole === 'admin');

      if (!user || !hasAccess) {
        router.push('/login');
      }
    }
  }, [user, isAuthReady, role, router]);

  if (!user) return null;

  return <>{children}</>;
}
