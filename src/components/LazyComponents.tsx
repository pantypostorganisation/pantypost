// src/components/LazyComponents.tsx

import dynamic from 'next/dynamic';

// Create a simple loading spinner component first
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff950e]"></div>
  </div>
);

// Example of how to lazy load components when you need them
// Just uncomment and update the paths when you have the actual components

// Example for admin components (when you have them):
/*
export const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);
*/

// For now, let's create lazy loaded versions of components you might already have:

// Lazy load the CloudinaryTest component if you use it
export const LazyCloudinaryTest = dynamic(
  () => import('@/components/CloudinaryTest'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

// Example for future use - Message components
export const LazyMessageNotifications = dynamic(
  () => import('@/components/MessageNotifications'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

// Export the LoadingSpinner so it can be used elsewhere
export { LoadingSpinner };

// Example skeleton for charts/heavy components
export const ChartSkeleton = () => (
  <div className="h-64 bg-gray-800 animate-pulse rounded" />
);

// Example skeleton for cards
export const CardSkeleton = () => (
  <div className="bg-gray-900 rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-800 rounded w-1/2" />
  </div>
);