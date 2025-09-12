// src/app/maintenance/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Under Maintenance
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          We're making some improvements to PantyPost.
          <br />
          We'll be back shortly.
        </p>

        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-pulse"></div>
          <span>Working on it{dots}</span>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm">
            Need assistance? Contact{' '}
            <a 
              href="mailto:support@pantypost.com" 
              className="text-[#ff950e] hover:underline"
            >
              support@pantypost.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}