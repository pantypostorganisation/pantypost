// src/components/PageWrapper.tsx
'use client';

import React from 'react';

/** Transparent wrapper for pages; reserved for future cross-page guards */
export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
