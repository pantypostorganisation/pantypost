// src/components/LazyFallbacks.tsx
'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export function AdminDashboardFallback() {
  return (
    <div className="min-h-screen bg-gray-950 p-6" aria-busy="true" aria-live="polite">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-800 rounded w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-6 animate-pulse" aria-hidden="true">
              <div className="h-12 w-12 bg-gray-800 rounded mb-4" />
              <div className="h-4 bg-gray-800 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-800 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalyticsChartFallback() {
  return (
    <div className="bg-gray-900 rounded-lg p-6" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="h-5 w-5 text-gray-600" />
        <div className="h-5 bg-gray-800 rounded w-32 animate-pulse" />
      </div>
      <div className="h-64 bg-gray-800 rounded animate-pulse" />
    </div>
  );
}

export function MessageThreadFallback() {
  return (
    <div className="bg-gray-950 rounded-lg p-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
        <div className="h-10 w-10 bg-gray-800 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-32 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-800 rounded w-24 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className="max-w-xs space-y-2">
              <div className="h-10 bg-gray-800 rounded-lg animate-pulse w-48" />
              <div className="h-3 bg-gray-800 rounded animate-pulse w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
