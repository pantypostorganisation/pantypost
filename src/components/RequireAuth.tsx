'use client';

import { useListings } from '@/context/ListingContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RequireAuth({
  role: requiredRole,
  children,
}: {
  role: 'buyer' | 'seller';
  children: React.ReactNode;
}) {
  const { user, role, isAuthReady } = useListings();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (isAuthReady) {
      if (!user || role !== requiredRole) {
        setShowFallback(true);
      }
    }
  }, [user, role, requiredRole, isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="p-10 text-center text-gray-600">
        Checking your login status...
      </div>
    );
  }

  if (showFallback) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">
          This page is for <span className="font-semibold">{requiredRole}s</span> only.
        </p>
        <Link
          href="/login"
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
