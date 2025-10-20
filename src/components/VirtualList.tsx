// src/components/VirtualList.tsx
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Guards to prevent pathological values
  const safeItemHeight = useMemo(() => (itemHeight > 0 ? itemHeight : 56), [itemHeight]);
  const safeOverscan = useMemo(() => (overscan >= 0 && Number.isFinite(overscan) ? overscan : 5), [overscan]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => safeItemHeight,
    overscan: safeOverscan,
    measureElement: (element) =>
      element instanceof HTMLElement
        ? element.getBoundingClientRect().height
        : safeItemHeight,
  });

  return (
    <div ref={parentRef} className={className} style={{ overflow: 'auto', willChange: 'transform' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
