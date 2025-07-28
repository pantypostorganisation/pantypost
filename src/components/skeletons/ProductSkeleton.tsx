// src/components/skeletons/ProductSkeleton.tsx

export function ProductCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-800 rounded w-20" />
          <div className="h-5 bg-gray-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}