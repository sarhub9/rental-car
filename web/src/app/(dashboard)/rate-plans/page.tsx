'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineTag, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight, HiOutlineCheckCircle, HiOutlineXCircle,
} from 'react-icons/hi2';
import { ratePlanService } from '@/services/rate-plan.service';
import { extractApiError } from '@/lib/api-error';

export default function RatePlansPage() {
  const router = useRouter();
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRatePlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ratePlanService.getRatePlans();
      setRatePlans(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load rate plans'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRatePlans(); }, [fetchRatePlans]);

  const handleToggle = async (plan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (plan.status === 'ACTIVE') {
        await ratePlanService.deactivateRatePlan(plan.id);
        toast.success('Rate plan deactivated');
      } else {
        await ratePlanService.updateRatePlan(plan.id, { is_active: true } as any);
        toast.success('Rate plan activated');
      }
      fetchRatePlans();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to update')); }
  };

  const filtered = ratePlans.filter(p => {
    const matchSearch = !search.trim() || (p.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? p.status === 'ACTIVE' : p.status !== 'ACTIVE');
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <HiOutlineTag className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Rate Plans</h1>
            <p className="text-sm text-gray-500">{ratePlans.length} plan{ratePlans.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/rate-plans/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> Create Rate Plan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rate plans..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {['ALL', 'ACTIVE', 'INACTIVE'].map(s => (
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
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineTag className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-gray-500 font-medium">No rate plans found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'Create your first rate plan'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weekly</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Incl. KM</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deposit</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p, idx) => {
                const isActive = p.status === 'ACTIVE';
                return (
                  <tr key={p.id}
                    onClick={() => router.push(`/rate-plans/${p.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                          <HiOutlineTag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          {p.version && <p className="text-xs text-gray-400">v{p.version}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {p.daily_rate != null ? `AED ${Number(p.daily_rate).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {p.weekly_rate != null ? `AED ${Number(p.weekly_rate).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {p.monthly_rate != null ? `AED ${Number(p.monthly_rate).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {p.included_km_per_day != null ? `${p.included_km_per_day} km/day` : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {p.deposit_amount != null ? `AED ${Number(p.deposit_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={e => handleToggle(p, e)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                          isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {isActive
                          ? <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                          : <HiOutlineXCircle className="w-3.5 h-3.5" />}
                        {isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
