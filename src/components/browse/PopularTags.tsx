// src/components/browse/PopularTags.tsx
'use client';

import { Tag, TrendingUp, Loader } from 'lucide-react';

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
  if (isLoading) {
    return (
      <div className="max-w-[1700px] mx-auto px-6 mb-6">
        <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading popular tags...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || tags.length === 0) {
    return null;
  }

  // Sort tags by count and take top tags
  const sortedTags = [...tags].sort((a, b) => b.count - a.count);
  
  // Calculate relative sizes based on count
  const maxCount = Math.max(...tags.map(t => t.count));
  const minCount = Math.min(...tags.map(t => t.count));
  const range = maxCount - minCount || 1;

  const getTagSize = (count: number) => {
    const normalized = (count - minCount) / range;
    if (normalized > 0.8) return 'text-sm font-bold';
    if (normalized > 0.5) return 'text-xs font-semibold';
    return 'text-xs font-medium';
  };

  const getTagColor = (count: number) => {
    const normalized = (count - minCount) / range;
    if (normalized > 0.8) return 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black border-[#ff950e]';
    if (normalized > 0.5) return 'bg-[#ff950e]/20 text-[#ff950e] border-[#ff950e]/50';
    return 'bg-black/50 text-gray-300 border-gray-600';
  };

  return (
    <div className="max-w-[1700px] mx-auto px-6 mb-6">
      <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 text-gray-400 min-w-fit pt-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Trending</span>
          </div>
          
          <div className="flex flex-wrap gap-2 flex-1">
            {sortedTags.map((tag) => (
              <button
                key={tag.tag}
                onClick={() => onTagClick(tag.tag)}
                className={`
                  px-3 py-1.5 rounded-full border transition-all duration-300
                  hover:scale-105 hover:shadow-lg cursor-pointer
                  ${getTagColor(tag.count)} ${getTagSize(tag.count)}
                  flex items-center gap-1.5 group
                `}
                title={`${tag.count} listings`}
              >
                <Tag className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                <span>{tag.tag}</span>
                <span className="opacity-60 text-[10px] font-normal">
                  ({tag.count})
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Optional: Show a hint */}
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <p className="text-[10px] text-gray-500 italic">
            Click a tag to filter listings • Tags are updated in real-time based on active listings
          </p>
        </div>
      </div>
    </div>
  );
}