'use client';

import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useEffect } from 'react';

type Props = {
  children: React.ReactNode;
  role?: 'buyer' | 'seller';
};

export default function RequireAuth({ children, role }: Props) {
  const router = useRouter();
  const { user, role: userRole, isAuthReady } = useListings();

  useEffect(() => {
    if (!isAuthReady) return; // wait for auth state to load

    if (!user) {
      router.replace('/login');
    } else if (role && userRole !== role) {
      router.replace('/login');
    }
  }, [user, userRole, role, router, isAuthReady]);

  // 👇 wait before showing anything
  if (!isAuthReady) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  // 👇 if not authorized, render nothing
  if (!user || (role && userRole !== role)) {
    return null;
  }

  // 👇 finally render the protected content
  return <>{children}</>;
}
