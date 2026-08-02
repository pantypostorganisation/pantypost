// src/components/browse/PopularTags.tsx
'use client';

import { TrendingUp } from 'lucide-react';

interface PopularTag {
  tag: string;
  count: number;
}

interface PopularTagsProps {
  tags: PopularTag[];
  onTagClick: (tag: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function PopularTags({ tags, onTagClick, isLoading, error }: PopularTagsProps) {
  if (isLoading || error || tags.length === 0) {
    // Nothing useful to show, and a loading strip for a secondary
    // feature adds more noise than it removes.
    return null;
  }

  const sortedTags = [...tags].sort((a, b) => b.count - a.count).slice(0, 12);

  return (
    <div className="mx-auto mb-6 max-w-[1600px] px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <TrendingUp className="h-3.5 w-3.5" />
          Trending
        </span>

        {/* Previously tags were sized and coloured by popularity, which
            produced a tag cloud — three type sizes and three colour
            treatments in one row. Uniform chips are easier to scan and
            the count still conveys popularity. */}
        {sortedTags.map((tag) => (
          <button
            key={tag.tag}
            onClick={() => onTagClick(tag.tag)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            title={`${tag.count} ${tag.count === 1 ? 'listing' : 'listings'}`}
          >
            {tag.tag}
            <span className="text-ink-faint">{tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}