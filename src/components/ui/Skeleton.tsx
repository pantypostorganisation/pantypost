// src/components/ui/Skeleton.tsx
'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

// Base Skeleton Component
export function Skeleton({
  className,
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-800',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
      {...props}
    />
  );
}

// Listing Card Skeleton
export function ListingCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
      {/* Image */}
      <Skeleton variant="rectangular" height={200} className="w-full" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton variant="text" className="w-3/4" />
        
        {/* Price and details */}
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="text" className="w-16" />
        </div>
        
        {/* Seller info */}
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
    </div>
  );
}

// User Profile Skeleton
export function UserProfileSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/3 h-6" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="text-center space-y-1">
            <Skeleton variant="text" className="w-12 h-8 mx-auto" />
            <Skeleton variant="text" className="w-20 mx-auto text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Message Thread Skeleton
export function MessageThreadSkeleton() {
  return (
    <div className="p-4 border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <Skeleton variant="text" className="w-32" />
            <Skeleton variant="text" className="w-16 text-xs" />
          </div>
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-3/4 text-sm" />
        </div>
      </div>
    </div>
  );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" className="w-24 h-5" />
        <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
      </div>
      
      <div className="flex gap-3">
        <Skeleton variant="rectangular" width={60} height={60} className="rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2 text-sm" />
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-gray-800">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="text" className="w-24" />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-4" />
        ))}
      </div>
      
      <div className="border-t border-gray-800 mt-2" />
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-2"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className="h-4"
              style={{ width: `${80 + Math.random() * 20}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="rectangular" className="w-full h-10" />
        </div>
      ))}
      <Skeleton variant="rectangular" className="w-32 h-10 mt-6" />
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
      <Skeleton variant="text" className="w-20 h-4 mb-2" />
      <Skeleton variant="text" className="w-32 h-8 mb-1" />
      <Skeleton variant="text" className="w-24 h-3" />
    </div>
  );
}

// Gallery Skeleton
export function GallerySkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          className="aspect-square w-full"
        />
      ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-32 h-6" />
        <Skeleton variant="rectangular" className="w-24 h-8 rounded" />
      </div>
      <Skeleton variant="rectangular" className="w-full" height={height} />
    </div>
  );
}
