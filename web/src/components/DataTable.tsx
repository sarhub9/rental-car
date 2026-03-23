'use client';

import { ReactNode } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export interface Column<T = any> {
  key?: string;
  label?: string;
  header?: string;
  render?: (value: any, row: T) => ReactNode;
  accessor?: (row: any, index?: number) => ReactNode;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  emptyMessage = 'No data found.',
  onRowClick,
}: DataTableProps<T>) {
  const skeletonRows = 5;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#CBD5E1] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1]">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#475569] whitespace-nowrap"
                >
                  {col.label || col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-[#CBD5E1]/50">
                  {columns.map((col, idx) => (
                    <td key={col.key || idx} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#64748B]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-[#CBD5E1]/50 transition-colors ${
                    rowIdx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'
                  } ${onRowClick ? 'cursor-pointer hover:bg-[#E0F2FE]' : 'hover:bg-[#F1F5F9]'}`}
                >
                  {columns.map((col, idx) => {
                    const value = col.key ? getNestedValue(row, col.key) : undefined;
                    const renderFn = col.render || col.accessor;
                    return (
                      <td key={col.key || idx} className="px-4 py-3 text-[#0F172A] whitespace-nowrap">
                        {renderFn ? (renderFn as any)(value ?? row, row) : (value ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#CBD5E1]/50 bg-[#F8FAFC]">
          <span className="text-sm text-[#64748B]">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
