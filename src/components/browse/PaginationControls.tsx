// src/components/browse/PaginationControls.tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationControlsProps } from '@/types/browse';

export default function PaginationControls({
  currentPage,
  totalPages,
  filteredListingsCount,
  pageSize,
  onPreviousPage,
  onNextPage,
  onPageClick
}: PaginationControlsProps) {
  if (filteredListingsCount <= pageSize && currentPage === 0) return null;

  const hasPrevious = currentPage > 0;
  const hasNext = filteredListingsCount > pageSize * (currentPage + 1);

  /* Page numbers, with ellipses where the range is long. Rendered as
     buttons rather than spans — they were clickable but not keyboard
     reachable before. */
  const pageNumbers = () => {
    if (totalPages <= 1) return null;

    const items: React.ReactNode[] = [];
    const pushPage = (i: number) => {
      const isCurrent = i === currentPage;
      items.push(
        <button
          key={i}
          onClick={() => onPageClick(i)}
          aria-current={isCurrent ? 'page' : undefined}
          className={`h-8 min-w-8 rounded-md px-2 text-sm transition-colors ${
            isCurrent
              ? 'bg-surface-hover font-semibold text-ink'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {i + 1}
        </button>
      );
    };

    const pushGap = (key: string) =>
      items.push(
        <span key={key} className="px-1 text-sm text-ink-faint">
          …
        </span>
      );

    if (currentPage > 1) pushPage(0);
    if (currentPage > 2) pushGap('start');

    const start = Math.max(0, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pushPage(i);

    if (currentPage < totalPages - 3) pushGap('end');
    if (currentPage < totalPages - 2) pushPage(totalPages - 1);

    return items;
  };

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        onClick={onPreviousPage}
        disabled={!hasPrevious}
        className="flex h-8 items-center gap-1 rounded-md px-3 text-sm text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <div className="flex items-center gap-1 px-2">{pageNumbers()}</div>

      <button
        onClick={onNextPage}
        disabled={!hasNext}
        className="flex h-8 items-center gap-1 rounded-md px-3 text-sm text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
