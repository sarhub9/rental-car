'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight, HiChevronLeft, HiChevronRight as HiChevronRightPag,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { extractApiError } from '@/lib/api-error';
import type { Agreement } from '@/types';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'ACTIVE', 'CLOSED'];

const STATUS_BADGE: Record<string, string> = {
  DRAFT:  'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

const LIMIT = 20;

export default function AgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: LIMIT, offset: (page - 1) * LIMIT };
      if (search.trim())          params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await agreementService.getAgreements(params);
      setAgreements(res.data ?? []);
      setTotalCount(res.pagination?.total ?? 0);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load agreements'));
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchAgreements(); }, [fetchAgreements]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const from = totalCount === 0 ? 0 : (page - 1) * LIMIT + 1;
  const to   = Math.min(page * LIMIT, totalCount);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineDocumentText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agreements</h1>
            <p className="text-sm text-gray-500">
              {totalCount > 0 ? `${totalCount} agreement${totalCount !== 1 ? 's' : ''}` : 'Rental agreements & contracts'}
            </p>
          </div>
        </div>
        <button onClick={() => router.push('/agreements/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> New Agreement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by agreement #, customer, vehicle..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineDocumentText className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-gray-500 font-medium">No agreements found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'Create your first agreement'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agreement</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agreements.map((a, idx) => {
                const badge = STATUS_BADGE[a.status] ?? 'bg-gray-100 text-gray-600';
                const isActive = a.status === 'ACTIVE';
                return (
                  <tr key={a.id}
                    onClick={() => router.push(`/agreements/${a.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{(page - 1) * LIMIT + idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-emerald-50' : 'bg-blue-50'
                        }`}>
                          <HiOutlineDocumentText className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-blue-400'}`} />
                        </div>
                        <span className="font-mono text-xs font-semibold text-blue-600">
                          {(a as any).agreement_number || `AGR-${String(a.id).slice(-5).toUpperCase()}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{(a as any).customer_name ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {(a as any).vehicle_info ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {(a as any).rental_start_datetime
                        ? new Date((a as any).rental_start_datetime).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {(a as any).rental_end_datetime
                        ? new Date((a as any).rental_end_datetime).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {(a as any).estimated_amount != null
                        ? `AED ${Number((a as any).estimated_amount).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-3.5">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{from}–{to}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span> agreements
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <HiChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}>{p}</button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Next <HiChevronRightPag className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
