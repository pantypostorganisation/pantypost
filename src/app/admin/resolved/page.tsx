// src/app/admin/resolved/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResolvedReportsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/reports');
  }, [router]);

  // Return a loading state while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to reports...</p>
      </div>
    </div>
  );
}
