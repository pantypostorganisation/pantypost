// src/components/AgeVerificationModal.tsx
'use client';

import { useEffect, useState } from 'react';

// Key is versioned: changing the stated threshold or terms should
// re-prompt everyone rather than silently inheriting an old acceptance.
const AGE_VERIFIED_KEY = 'pantypost_age_verified_v2';

export default function AgeVerificationModal(): React.ReactElement | null {
  /* =====================================================================
   * Why this starts hidden and decides in an effect.
   *
   * The obvious version reads localStorage in useState's initializer.
   * That looks correct but flashes: during server rendering there is no
   * localStorage, so the server (and React's first client render, which
   * must match it) always produces "not verified -> show the modal".
   * Only afterwards does an effect read the flag and hide it — so a
   * returning visitor sees the overlay for one frame every single load.
   *
   * Instead: render nothing until a client effect has actually decided.
   *   - Already accepted        -> we never show a frame of the modal.
   *   - Genuinely first visit   -> `decided` flips with show=true and it
   *                                appears a beat later, which is fine —
   *                                they have never seen it, so there is
   *                                nothing to "flash".
   *
   * `decided` gates the first paint; `show` is the actual verified state.
   * ===================================================================== */
  const [decided, setDecided] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let verified = false;
    try {
      verified = localStorage.getItem(AGE_VERIFIED_KEY) === 'true';
    } catch (error) {
      // Private mode / storage disabled: fail towards showing the gate
      // rather than silently letting someone past it.
      console.error('Error reading age verification:', error);
      verified = false;
    }
    setShow(!verified);
    setDecided(true);
  }, []);

  // Keep tabs in sync: accept in one, and any other open tab that is
  // still showing the overlay should drop it rather than stay stuck.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === AGE_VERIFIED_KEY && e.newValue === 'true') {
        setShow(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleYes = () => {
    try {
      localStorage.setItem(AGE_VERIFIED_KEY, 'true');
    } catch (error) {
      // If we cannot persist it, still let them in for this session —
      // but it will re-prompt next load, which is the safe direction.
      console.error('Error saving age verification:', error);
    }
    setShow(false);
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  // Nothing until the client has decided (prevents the SSR "show" frame),
  // and nothing once verified.
  if (!decided || !show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
      {/* Buttons are rounded-lg on purpose, matching this container and
          the site's button idiom -- they were stadium pills before, the
          only pills in the product (22 Aug 2026, Oakley's call). */}
      <div className="bg-[#161616] border-2 border-[#ff950e]/50 p-8 rounded-lg max-w-md w-full shadow-2xl shadow-[#ff950e]/10">
        <h2 className="text-2xl font-bold text-[#ff950e] mb-4 text-center">Age Verification</h2>
        <p className="mb-6 text-center text-gray-300">
          You must be at least 18 years old to enter this site. By entering, you confirm you are
          at least 18 years old, or older if the law where you live requires it.
        </p>
        <p className="text-sm mb-6 text-center text-gray-400">
          By entering, you agree to our{' '}
          <a href="/terms" className="text-[#ff950e] hover:underline">Terms</a>,{' '}
          <a href="/privacy" className="text-[#ff950e] hover:underline">Privacy Policy</a> and{' '}
          <a href="/content-policy" className="text-[#ff950e] hover:underline">Content Policy</a>.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleYes}
            type="button"
            className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-black font-bold rounded-lg overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span className="relative z-10">I am 18 or over</span>
          </button>
          <button
            onClick={handleNo}
            type="button"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}


