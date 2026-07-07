'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentChartBar, HiOutlineCurrencyDollar, HiOutlineTruck,
  HiOutlineWrenchScrewdriver, HiOutlineShieldExclamation, HiOutlineReceiptPercent,
  HiOutlineUserGroup, HiOutlineChartBar, HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import { reportsService } from '@/services/reports.service';
import { customerService } from '@/services/customer.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const TABS = [
  { key: 'revenue',     label: 'Revenue',           icon: <HiOutlineCurrencyDollar  className="h-4 w-4" /> },
  { key: 'vat',         label: 'VAT',               icon: <HiOutlineReceiptPercent   className="h-4 w-4" /> },
  { key: 'fleet',       label: 'Fleet Utilization', icon: <HiOutlineTruck            className="h-4 w-4" /> },
  { key: 'profit',      label: 'Vehicle Profit',    icon: <HiOutlineChartBar         className="h-4 w-4" /> },
  { key: 'maintenance', label: 'Maintenance Cost',  icon: <HiOutlineWrenchScrewdriver className="h-4 w-4" /> },
  { key: 'damage',      label: 'Damage Recovery',   icon: <HiOutlineShieldExclamation className="h-4 w-4" /> },
  { key: 'salik',       label: 'Salik & Fines',     icon: <HiOutlineDocumentChartBar  className="h-4 w-4" /> },
  { key: 'statement',   label: 'Customer Statement',icon: <HiOutlineUserGroup         className="h-4 w-4" /> },
  { key: 'pnl',         label: 'Profit & Loss',     icon: <HiOutlineArrowTrendingUp   className="h-4 w-4" /> },
];

const today = new Date().toISOString().split('T')[0];
const firstOfYear = `${new Date().getFullYear()}-01-01`;

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('revenue');
  const [from, setFrom] = useState(firstOfYear);
  const [to, setTo]     = useState(today);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Customer Statement state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchReport = useCallback(async () => {
    if (tab === 'statement' && !selectedCustomer) return;
    setLoading(true);
    setData(null);
    try {
      let result: any;
      if (tab === 'revenue')     result = await reportsService.getRevenueReport(from, to);
      else if (tab === 'vat')    result = await reportsService.getVatReport(from, to);
      else if (tab === 'fleet')  result = await reportsService.getFleetUtilization(from, to);
      else if (tab === 'profit') result = await reportsService.getVehicleProfit(from, to);
      else if (tab === 'maintenance') result = await reportsService.getMaintenanceCost(from, to);
      else if (tab === 'damage') result = await reportsService.getDamageRecovery(from, to);
      else if (tab === 'salik')  result = await reportsService.getSalikFines(from, to);
      else if (tab === 'statement' && selectedCustomer)
        result = await reportsService.getCustomerStatement(selectedCustomer.id, from, to);
      else if (tab === 'pnl')    result = await reportsService.getProfitLoss(from, to);
      setData(result);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load report'));
    } finally {
      setLoading(false);
    }
  }, [tab, from, to, selectedCustomer]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await customerService.searchCustomers(customerSearch);
        setCustomerResults(Array.isArray(res) ? res : []);
      } catch { setCustomerResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const fmt = (n: number) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${Number(n || 0).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <HiOutlineDocumentChartBar className="h-5 w-5 text-indigo-600" />
        </div>
        <PageHeader title="Reports" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setData(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>
        {tab === 'statement' && (
          <div className="relative flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
            <input type="text" value={customerSearch} placeholder="Search customer..."
              onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500" />
            {customerResults.length > 0 && !selectedCustomer && (
              <ul className="absolute z-10 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {customerResults.map((c: any) => (
                  <li key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.full_name_en); setCustomerResults([]); }}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 flex justify-between">
                    <span className="font-medium">{c.full_name_en}</span>
                    <span className="text-gray-400 text-xs">{c.phone_number}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button onClick={fetchReport}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          Run Report
        </button>
      </div>

      {/* Report content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-400">Select filters and run report</div>
      ) : (
        <div className="space-y-6">

          {/* ── Revenue ── */}
          {tab === 'revenue' && data.totals && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Agreements" value={data.totals.agreements?.toString()} />
                <SummaryCard label="Rental Revenue" value={fmt(data.totals.rental_revenue)} />
                <SummaryCard label="Extra Charges" value={fmt(data.totals.extra_charges)} />
                <SummaryCard label="Grand Total" value={fmt(data.totals.grand_total)} />
              </div>
              <DataTable columns={[
                { header: 'Period',   render: (r:any) => r.period },
                { header: 'Rentals',  render: (r:any) => r.agreements },
                { header: 'Rental Revenue', render: (r:any) => fmt(r.rental_revenue) },
                { header: 'Extras',   render: (r:any) => fmt(r.extra_charges) },
                { header: 'Total',    render: (r:any) => <span className="font-semibold">{fmt(r.total)}</span> },
              ]} data={data.by_period} emptyMessage="No data" />
              {data.by_category?.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700">By Category</h3>
                  <DataTable columns={[
                    { header: 'Category',   render: (r:any) => r.category },
                    { header: 'Agreements', render: (r:any) => r.agreements },
                    { header: 'Revenue',    render: (r:any) => fmt(r.revenue) },
                  ]} data={data.by_category} emptyMessage="No data" />
                </>
              )}
            </>
          )}

          {/* ── VAT ── */}
          {tab === 'vat' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Invoices" value={data.summary.invoice_count?.toString()} />
                <SummaryCard label="Taxable Amount" value={fmt(data.summary.taxable_amount)} />
                <SummaryCard label="VAT Collected (5%)" value={fmt(data.summary.vat_collected)} />
                <SummaryCard label="VAT Outstanding" value={fmt(data.summary.vat_outstanding)} sub="From unpaid invoices" />
              </div>
              <DataTable columns={[
                { header: 'Month',          render: (r:any) => r.month },
                { header: 'Invoices',       render: (r:any) => r.invoice_count },
                { header: 'Taxable Amount', render: (r:any) => fmt(r.taxable_amount) },
                { header: 'VAT Amount',     render: (r:any) => fmt(r.vat_amount) },
                { header: 'Gross Total',    render: (r:any) => fmt(r.gross_total) },
              ]} data={data.monthly_breakdown} emptyMessage="No VAT data" />
            </>
          )}

          {/* ── Fleet Utilization ── */}
          {tab === 'fleet' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Vehicles" value={data.summary.total_vehicles?.toString()} />
                <SummaryCard label="Avg Utilization" value={pct(data.summary.avg_utilization_pct)} />
                <SummaryCard label="High Utilization (≥70%)" value={data.summary.high_utilization?.toString()} />
                <SummaryCard label="Idle Vehicles" value={data.summary.fully_idle_vehicles?.toString()} />
              </div>
              <DataTable columns={[
                { header: 'Vehicle',      render: (r:any) => `${r.plate_number} — ${r.make} ${r.model}` },
                { header: 'Category',     render: (r:any) => r.category ?? '—' },
                { header: 'Rentals',      render: (r:any) => r.rental_count },
                { header: 'Rented Days',  render: (r:any) => r.rented_days },
                { header: 'Idle Days',    render: (r:any) => r.idle_days },
                { header: 'Utilization',  render: (r:any) => (
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(r.utilization_pct, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium">{pct(r.utilization_pct)}</span>
                  </div>
                )},
                { header: 'Revenue', render: (r:any) => fmt(r.revenue) },
              ]} data={data.vehicles} emptyMessage="No vehicle data" />
            </>
          )}

          {/* ── Vehicle Profit ── */}
          {tab === 'profit' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Revenue"    value={fmt(data.summary.total_revenue)} />
                <SummaryCard label="Total Cost"       value={fmt(data.summary.total_cost)} />
                <SummaryCard label="Gross Profit"     value={fmt(data.summary.total_profit)} />
                <SummaryCard label="Profitable Vehicles" value={`${data.summary.profitable_count} / ${data.summary.total_vehicles}`} />
              </div>
              <DataTable columns={[
                { header: 'Vehicle',    render: (r:any) => `${r.plate_number} — ${r.make} ${r.model}` },
                { header: 'Category',  render: (r:any) => r.category ?? '—' },
                { header: 'Rentals',   render: (r:any) => r.rental_count },
                { header: 'Revenue',   render: (r:any) => fmt(r.rental_revenue) },
                { header: 'Maint. Cost',render:(r:any) => fmt(r.maintenance_cost) },
                { header: 'Profit',    render: (r:any) => (
                  <span className={r.gross_profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {fmt(r.gross_profit)}
                  </span>
                )},
                { header: 'Margin',    render: (r:any) => pct(r.margin_pct) },
              ]} data={data.vehicles} emptyMessage="No vehicle data" />
            </>
          )}

          {/* ── Maintenance Cost ── */}
          {tab === 'maintenance' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Work Orders"    value={data.summary.total_work_orders?.toString()} />
                <SummaryCard label="Total Cost"     value={fmt(data.summary.total_actual)} />
                <SummaryCard label="Estimated Cost" value={fmt(data.summary.total_estimated)} />
                <SummaryCard label="Downtime Days"  value={data.summary.total_downtime_days?.toString()} />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">By Vehicle</h3>
              <DataTable columns={[
                { header: 'Vehicle',      render: (r:any) => `${r.plate_number} — ${r.make} ${r.model}` },
                { header: 'Work Orders',  render: (r:any) => r.work_orders },
                { header: 'Total Cost',   render: (r:any) => fmt(r.total_cost) },
                { header: 'Downtime Days',render: (r:any) => r.downtime_days },
              ]} data={data.by_vehicle} emptyMessage="No maintenance data" />
              <h3 className="text-sm font-semibold text-gray-700">By Type</h3>
              <DataTable columns={[
                { header: 'Type',       render: (r:any) => <span className="capitalize">{r.type}</span> },
                { header: 'Count',      render: (r:any) => r.count },
                { header: 'Total Cost', render: (r:any) => fmt(r.total_cost) },
              ]} data={data.by_type} emptyMessage="No data" />
            </>
          )}

          {/* ── Damage Recovery ── */}
          {tab === 'damage' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Charges"    value={data.summary.total_charges?.toString()} />
                <SummaryCard label="Total Amount"     value={fmt(data.summary.total_amount)} />
                <SummaryCard label="Approved Amount"  value={fmt(data.summary.approved_amount)} />
                <SummaryCard label="Recovery Rate"    value={pct(data.summary.recovery_rate)} />
              </div>
              <DataTable columns={[
                { header: 'Agreement',  render: (r:any) => r.agreement_number },
                { header: 'Customer',   render: (r:any) => r.customer_name },
                { header: 'Vehicle',    render: (r:any) => r.plate_number },
                { header: 'Amount',     render: (r:any) => fmt(r.amount) },
                { header: 'Status',     render: (r:any) => (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                    : r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>{r.status}</span>
                )},
                { header: 'Date',       render: (r:any) => new Date(r.created_at).toLocaleDateString() },
              ]} data={data.charges} emptyMessage="No damage charges" />
            </>
          )}

          {/* ── Salik & Fines ── */}
          {tab === 'salik' && data.summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Salik"           value={data.summary.salik?.toString()} />
                <SummaryCard label="Fines"           value={data.summary.fine?.toString()} />
                <SummaryCard label="Total Amount"    value={fmt(data.summary.total_amount)} />
                <SummaryCard label="Admin Fees"      value={fmt(data.summary.total_admin_fee)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Attributed"   value={data.summary.attributed?.toString()} />
                <SummaryCard label="Invoiced"     value={data.summary.invoiced?.toString()} />
                <SummaryCard label="Unattributed" value={data.summary.unattributed?.toString()} />
              </div>
              <DataTable columns={[
                { header: 'Type',              render: (r:any) => r.type },
                { header: 'Attribution Status',render: (r:any) => r.attribution_status },
                { header: 'Count',             render: (r:any) => r.count },
                { header: 'Amount',            render: (r:any) => fmt(r.total_amount) },
                { header: 'Admin Fee',         render: (r:any) => fmt(r.total_admin_fee) },
                { header: 'Recoverable',       render: (r:any) => fmt(r.total_recoverable) },
              ]} data={data.breakdown} emptyMessage="No data" />
            </>
          )}

          {/* ── P&L ── */}
          {tab === 'pnl' && data.summary && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                  <p className="text-xs text-green-600 mb-1 font-medium">Gross Revenue</p>
                  <p className="text-2xl font-bold text-green-700">{fmt(data.summary.gross_revenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">{data.summary.rental_count} rentals</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                  <p className="text-xs text-red-600 mb-1 font-medium">Total Costs</p>
                  <p className="text-2xl font-bold text-red-700">{fmt(data.summary.total_costs)}</p>
                  <p className="text-xs text-gray-400 mt-1">Expenses + Maintenance</p>
                </div>
                <div className={`rounded-xl border p-4 ${data.summary.net_profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                  <p className={`text-xs mb-1 font-medium ${data.summary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
                  <p className={`text-2xl font-bold ${data.summary.net_profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(data.summary.net_profit)}</p>
                  <p className="text-xs text-gray-400 mt-1">Margin: {data.summary.profit_margin}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Income Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Rental Revenue</span><span className="font-medium">{fmt(data.income?.rental_revenue)}</span></div>
                    {Object.entries(data.income?.extra_charges || {}).map(([k,v]:any) => (
                      <div key={k} className="flex justify-between text-sm text-gray-600"><span className="capitalize">{k.replace(/_/g,' ')}</span><span>{fmt(v)}</span></div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Gross Revenue</span><span className="text-green-700">{fmt(data.income?.gross_revenue)}</span></div>
                    <div className="flex justify-between text-xs text-gray-500"><span>VAT Collected</span><span>{fmt(data.income?.vat_collected)}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Expense Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(data.expenses?.by_category || {}).map(([k,v]:any) => (
                      <div key={k} className="flex justify-between text-sm text-gray-600"><span className="capitalize">{k.replace(/_/g,' ')}</span><span>{fmt(v)}</span></div>
                    ))}
                    <div className="flex justify-between text-sm text-gray-600"><span>Maintenance / Repairs</span><span>{fmt(data.expenses?.maintenance_cost)}</span></div>
                    <div className="flex justify-between text-sm font-bold border-t pt-2"><span>Total Costs</span><span className="text-red-700">{fmt(data.expenses?.total_costs)}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Customer Statement ── */}
          {tab === 'statement' && data.customer && (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-bold text-gray-900">{data.customer.full_name_en}</p>
                <p className="text-xs text-gray-500">{data.customer.phone_number} · {data.customer.email ?? '—'} · {data.customer.customer_type}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard label="Total Billed"  value={fmt(data.summary.total_billed)} />
                <SummaryCard label="Total Paid"    value={fmt(data.summary.total_paid)} />
                <SummaryCard label="Balance Due"   value={fmt(data.summary.balance_due)} />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Invoices</h3>
              <DataTable columns={[
                { header: 'Invoice #',  render: (r:any) => r.invoice_number },
                { header: 'Total',      render: (r:any) => fmt(r.total_amount) },
                { header: 'Paid',       render: (r:any) => fmt(r.amount_paid) },
                { header: 'Balance',    render: (r:any) => fmt(r.balance_due) },
                { header: 'Status',     render: (r:any) => r.status },
                { header: 'Date',       render: (r:any) => new Date(r.created_at).toLocaleDateString() },
              ]} data={data.invoices} emptyMessage="No invoices" />
              <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
              <DataTable columns={[
                { header: 'Payment #',  render: (r:any) => r.payment_number },
                { header: 'Amount',     render: (r:any) => fmt(r.amount) },
                { header: 'Method',     render: (r:any) => r.payment_method },
                { header: 'Invoice',    render: (r:any) => r.invoice_number ?? '—' },
                { header: 'Date',       render: (r:any) => new Date(r.payment_date).toLocaleDateString() },
              ]} data={data.payments} emptyMessage="No payments" />
            </>
          )}

        </div>
      )}
    </div>
  );
}
