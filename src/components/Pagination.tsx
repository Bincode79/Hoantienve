/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  );

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [onPageChange, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-1 py-4"
      role="navigation"
      aria-label="Pagination"
    >
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-black hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {currentPage > 3 && totalPages > 5 && (
        <>
          <button
            onClick={() => goToPage(1)}
            className="px-3 py-1 rounded-lg text-xs font-medium text-black hover:bg-gray-100 transition-colors"
            aria-label="Go to page 1"
          >
            1
          </button>
          <span className="px-1 text-gray-600" aria-hidden="true">...</span>
        </>
      )}
      {visible.map(p => (
        <button
          key={p}
          onClick={() => goToPage(p)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-w-[40px]',
            p === currentPage
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          )}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {currentPage < totalPages - 2 && totalPages > 5 && (
        <>
          <span className="px-1 text-neutral-400 font-bold" aria-hidden="true">...</span>
          <button
            onClick={() => goToPage(totalPages)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={`Go to page ${totalPages}`}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-black hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
});

// Removed default export
