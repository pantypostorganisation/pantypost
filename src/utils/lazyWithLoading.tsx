// src/utils/lazyWithLoading.tsx
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading skeleton component
export const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-800 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-800 rounded w-5/6 mb-2"></div>
    <div className="h-4 bg-gray-800 rounded w-4/6"></div>
  </div>
);

// Generic lazy loading wrapper
export function lazyWithLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType
) {
  return dynamic(importFunc, {
    loading: () => LoadingComponent ? <LoadingComponent /> : <LoadingSkeleton />,
    ssr: false // Disable SSR for admin components
  });
}

// Table loading skeleton
export const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-800 rounded animate-pulse"></div>
    ))}
  </div>
);

// Card loading skeleton
export const CardSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-full"></div>
  </div>
);

// Dashboard loading skeleton
export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);