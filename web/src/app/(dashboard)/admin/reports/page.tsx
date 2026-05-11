'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiChartBar,
  HiDocumentChartBar,
  HiFunnel,
} from 'react-icons/hi2';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { extractApiError } from '@/lib/api-error';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import type { RevenueReport } from '@/types';

const TABS = [
  { key: 'revenue', label: 'Revenue Report' },
  { key: 'receivables', label: 'Receivables' },
  { key: 'agreements', label: 'Agreement Statistics' },
];

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16',
];

function formatAED(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return 'AED 0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'AED 0.00';
  return `AED ${num.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
  const [receivablesData, setReceivablesData] = useState<any | null>(null);
  const [agreementData, setAgreementData] = useState<any | null>(null);

  // Default date range: last 6 months
  useEffect(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    setDateFrom(sixMonthsAgo.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  }, []);

  const fetchRevenueReport = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const data = await adminService.getRevenueReport({
        period: period as 'monthly' | 'weekly',
      });
      setRevenueData(data);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to load revenue report'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, period]);

  const fetchReceivablesReport = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const data = await adminService.getReceivablesReport();
      setReceivablesData(data);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to load receivables report'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchAgreementStatistics = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const data = await adminService.getAgreementsReport();
      setAgreementData(data);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to load agreement statistics'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, period]);

  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    if (activeTab === 'revenue') fetchRevenueReport();
    else if (activeTab === 'receivables') fetchReceivablesReport();
    else if (activeTab === 'agreements') fetchAgreementStatistics();
  }, [activeTab, dateFrom, dateTo, period, fetchRevenueReport, fetchReceivablesReport, fetchAgreementStatistics]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex items-center gap-2">
            <HiFunnel className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(activeTab === 'revenue' || activeTab === 'agreements') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Revenue Report Tab */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6">
              {/* Revenue Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard
                    title="Total Billed"
                    value={formatAED(revenueData.total_billed ?? 0)}
                    icon={<HiDocumentChartBar className="h-6 w-6" />}
                  />
                  <StatsCard
                    title="Total Collected"
                    value={formatAED(revenueData.total_collected ?? 0)}
                    icon={<HiChartBar className="h-6 w-6" />}
                  />
                  <StatsCard
                    title="Outstanding"
                    value={formatAED(revenueData.total_outstanding ?? 0)}
                    icon={<HiChartBar className="h-6 w-6" />}
                  />
                </div>
              </div>

              {/* Revenue Details Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                        <th className="px-6 py-3">Period</th>
                        <th className="px-6 py-3 text-right">Total Invoices</th>
                        <th className="px-6 py-3 text-right">Billed</th>
                        <th className="px-6 py-3 text-right">Collected</th>
                        <th className="px-6 py-3 text-right">Outstanding</th>
                        <th className="px-6 py-3 text-right">VAT</th>
                        <th className="px-6 py-3 text-right">Collection Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{revenueData.period}</td>
                        <td className="px-6 py-4 text-sm text-right">{revenueData.total_invoices}</td>
                        <td className="px-6 py-4 text-sm text-right">{formatAED(revenueData.total_billed)}</td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">{formatAED(revenueData.total_collected)}</td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">{formatAED(revenueData.total_outstanding)}</td>
                        <td className="px-6 py-4 text-sm text-right">{formatAED(revenueData.total_vat)}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={`font-medium ${revenueData.collection_rate >= 80 ? 'text-green-600' : revenueData.collection_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {typeof revenueData.collection_rate === 'number' ? `${revenueData.collection_rate.toFixed(1)}%` : `${revenueData.collection_rate}%`}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Receivables Tab */}
          {activeTab === 'receivables' && receivablesData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                  title="Total Outstanding"
                  value={formatAED(receivablesData.total_outstanding ?? 0)}
                  icon={<HiDocumentChartBar className="h-6 w-6" />}
                />
                <StatsCard
                  title="Overdue Amount"
                  value={formatAED(receivablesData.overdue_amount ?? 0)}
                  icon={<HiChartBar className="h-6 w-6" />}
                />
                <StatsCard
                  title="Number of Overdue Invoices"
                  value={receivablesData.overdue_count ?? 0}
                  icon={<HiChartBar className="h-6 w-6" />}
                />
              </div>

              {/* Breakdown Table */}
              {receivablesData.breakdown && receivablesData.breakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Outstanding Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3 text-right">Count</th>
                          <th className="px-6 py-3 text-right">Amount</th>
                          <th className="px-6 py-3 text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {receivablesData.breakdown.map((row: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium">{row.category || row.aging_bucket || row.label}</td>
                            <td className="px-6 py-4 text-sm text-right">{row.count}</td>
                            <td className="px-6 py-4 text-sm text-right">{formatAED(row.amount)}</td>
                            <td className="px-6 py-4 text-sm text-right">
                              {typeof row.percentage === 'number' ? `${row.percentage.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agreement Statistics Tab */}
          {activeTab === 'agreements' && agreementData && (
            <div className="space-y-6">
              {/* Status Distribution Pie Chart */}
              {agreementData.status_counts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(agreementData.status_counts).map(([name, value]) => ({
                            name: name.replace(/_/g, ' '),
                            value: value as number,
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {Object.entries(agreementData.status_counts).map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Counts Summary */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Counts by Status</h3>
                    <div className="space-y-3">
                      {Object.entries(agreementData.status_counts).map(([status, count], index) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span className="text-sm text-gray-700 capitalize">
                              {status.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </div>
                          <span className="text-sm font-semibold">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trends */}
              {agreementData.trends && agreementData.trends.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Agreement Trends</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={agreementData.trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="new_agreements" stroke="#3B82F6" name="New" strokeWidth={2} />
                      <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={2} />
                      <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
