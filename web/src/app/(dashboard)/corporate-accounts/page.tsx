'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight,
} from 'react-icons/hi2';
import { corporateAccountService } from '@/services/corporate-account.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  SUSPENDED:'bg-red-100 text-red-700',
};

export default function CorporateAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateAccountService.listCorporateAccounts();
      setAccounts(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load corporate accounts'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const filtered = accounts.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.company_name ?? '').toLowerCase().includes(q) ||
      (a.contact_person ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Corporate Accounts</h1>
            <p className="text-sm text-gray-500">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/corporate-accounts/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> New Account
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="relative max-w-sm">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, contact, email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineBuildingOffice2 className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-gray-500 font-medium">No corporate accounts found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Add your first corporate account'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit Limit</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a, i) => {
                const badge = STATUS_BADGE[a.status ?? 'ACTIVE'] ?? 'bg-gray-100 text-gray-600';
                const hasBalance = Number(a.outstanding_balance) > 0;
                return (
                  <tr key={a.id}
                    onClick={() => router.push(`/corporate-accounts/${a.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {a.company_name?.charAt(0)?.toUpperCase() ?? 'C'}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{a.company_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900">{a.contact_person ?? '—'}</p>
                      {a.email && <p className="text-xs text-gray-400">{a.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{a.phone ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-700">
                      {a.credit_limit != null ? `AED ${Number(a.credit_limit).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {a.outstanding_balance != null
                        ? <span className={`font-semibold ${hasBalance ? 'text-red-600' : 'text-gray-700'}`}>
                            AED {Number(a.outstanding_balance).toLocaleString()}
                          </span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                        {a.status ?? 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
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
