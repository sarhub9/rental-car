'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiPlus, HiMagnifyingGlass, HiChevronRight,
  HiOutlineBanknotes, HiXMark,
} from 'react-icons/hi2';
import { expenseService } from '@/services/expense.service';
import { extractApiError } from '@/lib/api-error';

const CATEGORIES = [
  'VEHICLE_MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'FUEL', 'RENT',
  'SALARY', 'UTILITIES', 'MARKETING', 'SALIK_RECHARGE', 'REPAIR', 'OFFICE', 'BANK_CHARGES', 'OTHER',
];

const fmt = (n: number) => `AED ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// ── Expense Drawer (view only) ────────────────────────────────────────────────
function ExpenseDrawer({ open, onClose, expense }: {
  open: boolean; onClose: () => void; expense: any | null;
}) {
  if (!expense) return null;
  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
              <HiOutlineBanknotes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Expense Details</h2>
              <p className="text-xs text-gray-500 font-mono">{expense.expense_number || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Expense Info</p>
            <div className="space-y-3">
              {[
                { label: 'Category',    value: expense.category?.replace(/_/g, ' ') },
                { label: 'Date',        value: expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '—' },
                { label: 'Description', value: expense.description },
                { label: 'Vendor',      value: expense.vendor_name },
                { label: 'Reference',   value: expense.reference_number },
                { label: 'Payment',     value: expense.payment_method?.replace(/_/g, ' ') },
                { label: 'Vehicle',     value: expense.plate_number },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Amounts</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-semibold text-gray-900">{fmt(parseFloat(expense.amount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">VAT</span>
                <span className="text-sm font-semibold text-gray-900">{fmt(parseFloat(expense.vat_amount || 0))}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="text-sm font-bold text-gray-900">{fmt(parseFloat(expense.total_amount || expense.amount || 0))}</span>
              </div>
            </div>
          </div>

          {expense.notes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed">{expense.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [summary, setSummary]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [catFilter, setCatFilter] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected]   = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo]     = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.list({
        category:  catFilter !== 'ALL' ? catFilter : undefined,
        date_from: dateFrom,
        date_to:   dateTo,
      });
      setExpenses(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load expenses'));
      setExpenses([]);
    } finally { setLoading(false); }

    try {
      const sum = await expenseService.summary(dateFrom, dateTo);
      setSummary(Array.isArray(sum) ? sum : (sum?.data ?? []));
    } catch { setSummary([]); }
  }, [catFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filtered = expenses.filter(e =>
    !search ||
    (e.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.vendor_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.expense_number ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = summary.reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
  const totalVat    = summary.reduce((s, r) => s + parseFloat(r.total_vat    || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {expenses.length > 0 ? `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}` : 'Track business expenses'}
          </p>
        </div>
        <button onClick={() => router.push('/expenses/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Add Expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalAmount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">VAT Paid</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totalVat)}</p>
        </div>
        {summary.slice(0, 2).map((s: any) => (
          <div key={s.category} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-gray-500 mb-1 capitalize">{s.category.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-gray-900">{fmt(parseFloat(s.total_amount))}</p>
            <p className="text-xs text-gray-400">{s.count} entries</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[160px]">
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineBanknotes className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No expenses found</p>
            <p className="text-sm text-gray-400 mt-1">Record your first expense</p>
            <button onClick={() => router.push('/expenses/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense #</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} onClick={() => { setSelected(e); setDrawerOpen(true); }}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-gray-600">{e.expense_number || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                      {(e.category || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700 max-w-xs truncate">{e.description}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{e.vendor_name || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{fmt(parseFloat(e.amount || 0))}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-500 capitalize">{(e.payment_method || '').replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <ExpenseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} expense={selected} />
    </div>
  );
}
