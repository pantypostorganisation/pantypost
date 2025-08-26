// src/components/skeletons/AdminSkeletons.tsx
'use client';

import { useMemo } from 'react';

/** Utility: clamp a numeric count to avoid runaway DOM renders */
const clampCount = (n: number | undefined, min = 1, max = 50) =>
  Number.isFinite(n as number) ? Math.min(max, Math.max(min, Math.floor(n as number))) : min;

// Ban Card Skeleton
export function BanCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6" role="status" aria-live="polite" aria-busy="true">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 bg-gray-800 rounded w-32 animate-pulse" />
            <div className="h-5 bg-gray-800 rounded w-20 animate-pulse" />
          </div>

          <div className="h-4 bg-gray-800 rounded w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-800 rounded w-36 animate-pulse" />
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <div className="h-8 bg-gray-800 rounded w-16 animate-pulse" />
          <div className="h-8 bg-gray-800 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Report Card Skeleton
export function ReportCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden" role="status" aria-live="polite" aria-busy="true">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 bg-gray-800 rounded w-48 animate-pulse" />
              </div>
              <div className="h-5 bg-gray-800 rounded w-24 animate-pulse" />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-800 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-800 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 bg-gray-800 rounded w-24 animate-pulse" />
            <div className="h-8 bg-gray-800 rounded w-24 animate-pulse" />
            <div className="h-5 w-5 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wallet User List Skeleton
export function WalletUserListSkeleton() {
  return (
    <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg" role="status" aria-live="polite" aria-busy="true">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-800 rounded animate-pulse" />
          <div className="h-6 bg-gray-800 rounded w-24 animate-pulse" />
        </div>
      </div>

      <div className="p-2 space-y-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="p-3 rounded-lg bg-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-800 rounded animate-pulse" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 bg-gray-800 rounded w-32 animate-pulse" />
                    <div className="h-5 bg-gray-800 rounded w-16 animate-pulse" />
                  </div>
                  <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Admin Stats Skeleton (for dashboard stats)
export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
            <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="h-8 bg-gray-800 rounded w-24 animate-pulse mb-1" />
          <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// Message Thread Skeleton
export function MessageThreadSkeleton() {
  // Precompute stable widths so they don't change on re-render
  const bubbleWidths = useMemo(
    () => Array.from({ length: 5 }, () => 100 + Math.floor(Math.random() * 100)),
    []
  );

  return (
    <div className="space-y-4 p-4" role="status" aria-live="polite" aria-busy="true">
      {bubbleWidths.map((w, index) => (
        <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className="max-w-xs space-y-2">
            <div className="flex items-center gap-2">
              {index % 2 === 0 && <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse" />}
              <div
                className={`h-10 bg-gray-800 rounded-lg animate-pulse ${
                  index % 2 === 0 ? 'rounded-bl-none' : 'rounded-br-none'
                }`}
                style={{ width: `${w}px` }}
              />
              {index % 2 !== 0 && <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse" />}
            </div>
            <div className="h-3 bg-gray-800 rounded animate-pulse w-20 ml-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Verification Card Skeleton
export function VerificationCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6" role="status" aria-live="polite" aria-busy="true">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-800 rounded-full animate-pulse" />
          <div>
            <div className="h-5 bg-gray-800 rounded w-32 animate-pulse mb-1" />
            <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="h-5 bg-gray-800 rounded w-20 animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-800 rounded animate-pulse" />
        ))}
      </div>

      <div className="flex gap-2">
        <div className="h-9 bg-gray-800 rounded flex-1 animate-pulse" />
        <div className="h-9 bg-gray-800 rounded flex-1 animate-pulse" />
      </div>
    </div>
  );
}

// Order Card Skeleton (from your OrderCard component)
export function OrderCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden" role="status" aria-live="polite" aria-busy="true">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="h-12 w-12 bg-gray-800 rounded-full animate-pulse" />
            <div>
              <div className="h-5 bg-gray-800 rounded w-48 animate-pulse mb-2" />
              <div className="flex gap-4">
                <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded w-20 animate-pulse" />
                <div className="h-4 bg-gray-800 rounded w-16 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-800 rounded w-24 animate-pulse" />
            <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// List Skeletons (for multiple items)
export function BanListSkeleton({ count = 5 }: { count?: number }) {
  const safe = clampCount(count, 1, 50);
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: safe }).map((_, index) => (
        <BanCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ReportListSkeleton({ count = 5 }: { count?: number }) {
  const safe = clampCount(count, 1, 50);
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: safe }).map((_, index) => (
        <ReportCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function OrderListSkeleton({ count = 5 }: { count?: number }) {
  const safe = clampCount(count, 1, 50);
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: safe }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}
