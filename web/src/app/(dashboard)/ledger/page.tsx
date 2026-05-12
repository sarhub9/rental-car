'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBookOpen, HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { customerService } from '@/services/customer.service';
import { corporateAccountService } from '@/services/corporate-account.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const extract = (r: any) => { const d = r.data; return d && typeof d === 'object' && 'data' in d ? d.data : d; };
const fmt = (n: any) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().split('T')[0];
const firstOfYear = `${new Date().getFullYear()}-01-01`;

export default function LedgerPage() {
  const [tab, setTab]   = useState<'customer' | 'corporate'>('customer');
  const [from, setFrom] = useState(firstOfYear);
  const [to, setTo]     = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<any>(null);

  // Customer search
  const [custSearch, setCustSearch]   = useState('');
  const [custResults, setCustResults] = useState<any[]>([]);
  const [selectedCust, setSelectedCust] = useState<any>(null);

  // Corporate search
  const [corpAccounts, setCorpAccounts] = useState<any[]>([]);
  const [selectedCorp, setSelectedCorp] = useState<any>(null);

  useEffect(() => {
    if (!custSearch.trim()) { setCustResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await customerService.searchCustomers(custSearch); setCustResults(Array.isArray(r) ? r : []); }
      catch { setCustResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [custSearch]);

  useEffect(() => {
    corporateAccountService.listCorporateAccounts().then((r: any) => {
      setCorpAccounts(Array.isArray(r) ? r : (r?.data || []));
    }).catch(() => {});
  }, []);

  const runReport = async () => {
    if (tab === 'customer' && !selectedCust) { toast.error('Select a customer first'); return; }
    if (tab === 'corporate' && !selectedCorp) { toast.error('Select a corporate account first'); return; }
    try {
      setLoading(true);
      setData(null);
      const url = tab === 'customer'
        ? `/v1/ledger/customer/${selectedCust.id}`
        : `/v1/ledger/corporate/${selectedCorp.id}`;
      const r = await apiClient.get(url, { params: { from, to } });
      setData(extract(r));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load ledger'));
    } finally { setLoading(false); }
  };

  const typeColor: Record<string, string> = {
    INVOICE: 'bg-red-100 text-red-700',
    PAYMENT: 'bg-green-100 text-green-700',
    DEPOSIT: 'bg-blue-100 text-blue-700',
    REFUND:  'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <HiOutlineBookOpen className="h-5 w-5 text-emerald-600" />
        </div>
        <PageHeader title="Ledger" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['customer','Customer Ledger'],['corporate','Corporate Statement']].map(([key,label]) => (
          <button key={key} onClick={() => { setTab(key as any); setData(null); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===key?'border-emerald-600 text-emerald-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {key==='corporate'?<HiOutlineBuildingOffice2 className="h-4 w-4"/>:null}{label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>

        {tab === 'customer' && (
          <div className="relative flex-1 min-w-[220px]">
            <label className="block text-xs text-gray-500 mb-1">Customer</label>
            <input type="text" value={custSearch} placeholder="Search by name or phone..."
              onChange={e => { setCustSearch(e.target.value); setSelectedCust(null); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" />
            {custResults.length > 0 && !selectedCust && (
              <ul className="absolute z-10 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {custResults.map((c:any) => (
                  <li key={c.id} onClick={() => { setSelectedCust(c); setCustSearch(c.full_name_en); setCustResults([]); }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 flex justify-between">
                    <span className="font-medium">{c.full_name_en}</span>
                    <span className="text-gray-400 text-xs">{c.phone_number}</span>
                  </li>
                ))}
              </ul>
            )}
            {selectedCust && <p className="text-xs text-green-600 mt-0.5">✓ {selectedCust.full_name_en}</p>}
          </div>
        )}

        {tab === 'corporate' && (
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs text-gray-500 mb-1">Corporate Account</label>
            <select value={selectedCorp?.id ?? ''} onChange={e => setSelectedCorp(corpAccounts.find((c:any) => c.id === e.target.value) || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
              <option value="">Select account...</option>
              {corpAccounts.map((c:any) => <option key={c.id} value={c.id}>{c.company_name} ({c.account_number})</option>)}
            </select>
          </div>
        )}

        <button onClick={runReport}
          className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
          Run Report
        </button>
      </div>

      {loading && <div className="flex justify-center py-16"><Spinner /></div>}

      {data && !loading && (
        <div className="space-y-6">
          {/* Header info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            {tab === 'customer' ? (
              <div>
                <p className="font-bold text-gray-900">{data.customer?.full_name_en}</p>
                <p className="text-xs text-gray-500">{data.customer?.phone_number} · {data.customer?.customer_type}</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-gray-900">{data.account?.company_name}</p>
                <p className="text-xs text-gray-500">Account: {data.account?.account_number} · Credit Limit: {fmt(data.account?.credit_limit)}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {tab === 'customer' ? <>
              <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-red-600 mb-1">Total Debit</p><p className="text-xl font-bold text-red-700">{fmt(data.summary?.total_debit)}</p></div>
              <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-green-600 mb-1">Total Credit</p><p className="text-xl font-bold text-green-700">{fmt(data.summary?.total_credit)}</p></div>
              <div className={`rounded-xl p-4 ${data.summary?.closing_balance > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500 mb-1">Balance Due</p>
                <p className={`text-xl font-bold ${data.summary?.closing_balance > 0 ? 'text-orange-700' : 'text-gray-700'}`}>{fmt(data.summary?.closing_balance)}</p>
              </div>
            </> : <>
              <div className="bg-red-50 rounded-xl p-4"><p className="text-xs text-red-600 mb-1">Total Billed</p><p className="text-xl font-bold text-red-700">{fmt(data.summary?.total_billed)}</p></div>
              <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-green-600 mb-1">Total Paid</p><p className="text-xl font-bold text-green-700">{fmt(data.summary?.total_paid)}</p></div>
              <div className="bg-orange-50 rounded-xl p-4"><p className="text-xs text-orange-600 mb-1">Balance Due</p><p className="text-xl font-bold text-orange-700">{fmt(data.summary?.balance_due)}</p></div>
            </>}
          </div>

          {/* Transactions (customer ledger) */}
          {tab === 'customer' && (
            <DataTable
              columns={[
                { header: 'Date',       render: (r:any) => new Date(r.txn_date).toLocaleDateString() },
                { header: 'Type',       render: (r:any) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColor[r.txn_type]||'bg-gray-100 text-gray-600'}`}>{r.txn_type}</span> },
                { header: 'Reference',  render: (r:any) => <span className="font-mono text-xs">{r.reference}</span> },
                { header: 'Description',render: (r:any) => r.description },
                { header: 'Debit',      render: (r:any) => r.debit ? <span className="text-red-600">{fmt(r.debit)}</span> : '—' },
                { header: 'Credit',     render: (r:any) => r.credit ? <span className="text-green-600">{fmt(r.credit)}</span> : '—' },
                { header: 'Balance',    render: (r:any) => <span className={`font-semibold ${r.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>{fmt(r.balance)}</span> },
              ]}
              data={data.transactions || []}
              emptyMessage="No transactions in this period"
            />
          )}

          {/* Corporate invoices */}
          {tab === 'corporate' && (
            <>
              <h3 className="text-sm font-semibold text-gray-700">Invoices</h3>
              <DataTable
                columns={[
                  { header: 'Invoice #',    render: (r:any) => r.invoice_number },
                  { header: 'Customer',     render: (r:any) => r.customer_name },
                  { header: 'Total',        render: (r:any) => fmt(r.total_amount) },
                  { header: 'Paid',         render: (r:any) => fmt(r.amount_paid) },
                  { header: 'Balance',      render: (r:any) => <span className={r.balance_due > 0 ? 'text-red-600 font-semibold' : ''}>{fmt(r.balance_due)}</span> },
                  { header: 'Status',       render: (r:any) => r.status },
                  { header: 'Date',         render: (r:any) => new Date(r.created_at).toLocaleDateString() },
                ]}
                data={data.invoices || []}
                emptyMessage="No invoices"
              />
              <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
              <DataTable
                columns={[
                  { header: 'Payment #',  render: (r:any) => r.payment_number },
                  { header: 'Customer',   render: (r:any) => r.customer_name },
                  { header: 'Amount',     render: (r:any) => fmt(r.amount) },
                  { header: 'Method',     render: (r:any) => r.payment_method },
                  { header: 'Date',       render: (r:any) => new Date(r.payment_date).toLocaleDateString() },
                ]}
                data={data.payments || []}
                emptyMessage="No payments"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
