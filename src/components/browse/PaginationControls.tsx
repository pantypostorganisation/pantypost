// src/components/browse/PaginationControls.tsx
'use client';

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
  const renderPageIndicators = () => {
    if (totalPages <= 1) return null;

    const indicators = [];

    if (currentPage > 0) {
      indicators.push(
        <span
          key={0}
          className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]"
          onClick={() => onPageClick(0)}
        >
          1
        </span>
      );
    }

    if (currentPage > 2) {
      indicators.push(
        <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages - 2, currentPage + 1);

    if (endPage - startPage < 2 && totalPages > 3) {
      if (startPage === 1) {
        endPage = Math.min(totalPages - 2, 3);
      } else if (endPage === totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        indicators.push(
          <span key={i} className="px-2 py-1 text-sm font-bold text-[#ff950e] border-b-2 border-[#ff950e]">
            {i + 1}
          </span>
        );
      } else {
        indicators.push(
          <span
            key={i}
            className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]"
            onClick={() => onPageClick(i)}
          >
            {i + 1}
          </span>
        );
      }
    }

    if (endPage < totalPages - 2) {
      indicators.push(
        <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }

    if (currentPage < totalPages - 1) {
      indicators.push(
        <span
          key={totalPages - 1}
          className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]"
          onClick={() => onPageClick(totalPages - 1)}
        >
          {totalPages}
        </span>
      );
    }

    return (
      <div className="flex justify-center items-center gap-1 mt-4" aria-label="Pagination">
        {indicators}
      </div>
    );
  };

  if (filteredListingsCount <= pageSize && currentPage === 0) return null;

  return (
    <div className="flex flex-col items-center mt-16 gap-4">
      <div className="flex gap-4">
        {currentPage > 0 && (
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#222] text-white font-bold hover:from-[#222] hover:to-[#333] transition-all border border-gray-800 shadow-lg hover:shadow-xl"
            onClick={onPreviousPage}
            aria-label="Previous page"
          >
            ← Previous
          </button>
        )}
        {filteredListingsCount > pageSize * (currentPage + 1) && (
          <button
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={onNextPage}
            aria-label="Next page"
          >
            Next →
          </button>
        )}
      </div>
      {renderPageIndicators()}
    </div>
  );
}
