// src/components/browse/EmptyState.tsx
'use client';

import { SearchX } from 'lucide-react';
import { EmptyStateProps } from '@/types/browse';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function EmptyState({ searchTerm, onResetFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-line bg-surface-raised px-6 py-20 text-center">
      <SearchX className="mb-4 h-10 w-10 text-ink-faint" />

      <h3 className="text-lg font-semibold text-ink">No listings found</h3>

      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        {searchTerm ? (
          <>
            Nothing matched{' '}
            <SecureMessageDisplay
              content={searchTerm}
              allowBasicFormatting={false}
              className="inline font-medium text-ink"
            />
            . Try a different search or clear your filters.
          </>
        ) : (
          'Try adjusting your filters, or check back shortly for new listings.'
        )}
      </p>

      <button
        onClick={onResetFilters}
        className="mt-6 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
        aria-label="Reset all filters"
      >
        Clear filters
      </button>
    </div>
  );
}
