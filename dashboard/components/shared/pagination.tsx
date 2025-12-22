'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show (max 5)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
      {/* Info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold font-mono text-gray-900">{startItem}-{endItem}</span> of{' '}
        <span className="font-semibold font-mono text-gray-900">{totalItems}</span> accounts
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                page === currentPage
                  ? 'bg-amber-500 text-white border border-amber-500'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 disabled:hover:bg-white transition-all"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
