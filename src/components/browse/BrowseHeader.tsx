// src/components/browse/BrowseHeader.tsx
'use client';

import { Package, ShoppingBag, Crown, Gavel, Info } from 'lucide-react';
import { BrowseHeaderProps } from '@/types/browse';

/* Filter definitions live in one array so the four buttons cannot drift
   apart in styling — previously each was a separate block with its own
   copy of a long gradient class string. */
const FILTERS = [
  { key: 'all', label: 'All', icon: Package },
  { key: 'standard', label: 'Standard', icon: ShoppingBag },
  { key: 'premium', label: 'Premium', icon: Crown },
  { key: 'auction', label: 'Auctions', icon: Gavel },
] as const;

export default function BrowseHeader({
  user,
  filteredListingsCount,
  filter,
  categoryCounts,
  onFilterChange
}: BrowseHeaderProps) {
  const notice =
    user?.role === 'seller'
      ? 'You are browsing as a seller. You can view listings but cannot purchase.'
      : user?.role === 'admin'
      ? 'You are browsing as an admin. You can view listings for moderation but cannot purchase or bid.'
      : null;

  return (
    <div className="mx-auto mb-6 max-w-[1600px] px-6">
      {notice && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-line bg-surface-raised px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <p className="text-sm text-ink-muted">{notice}</p>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Browse</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {filteredListingsCount} {filteredListingsCount === 1 ? 'listing' : 'listings'}
            {filter !== 'all' && ` in ${filter}`}
          </p>
        </div>

        {/* Segmented control. One container, one border, dividers between
            options — reads as a single control rather than four
            independent buttons. */}
        <div className="flex w-full overflow-x-auto rounded-md border border-line bg-surface-raised p-1 lg:w-auto">
          {FILTERS.map(({ key, label, icon: Icon }) => {
            const isActive = filter === key;
            const count = categoryCounts[key as keyof typeof categoryCounts];

            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors lg:flex-none ${
                  isActive
                    ? 'bg-surface-hover text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
                aria-pressed={isActive}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
                {label}
                <span
                  className={`text-xs ${isActive ? 'text-ink-muted' : 'text-ink-faint'}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
