// src/components/a11y/SkipLinks.tsx

import Link from 'next/link';

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <Link
        href="#main-content"
        className="absolute top-0 left-0 p-2 bg-[#ff950e] text-black font-medium focus:z-50"
      >
        Skip to main content
      </Link>
      <Link
        href="#navigation"
        className="absolute top-0 left-0 p-2 bg-[#ff950e] text-black font-medium focus:z-50"
      >
        Skip to navigation
      </Link>
    </div>
  );
}