'use client';

import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-cyan-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronRight className="h-4 w-4" />
        </button>
      </div>
      <span className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}
