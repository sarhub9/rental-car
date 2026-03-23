'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineBanknotes,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineReceiptPercent,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { adminService } from '@/services/admin.service';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';

export default function AccountsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await adminService.getAdminDashboard();
        setDashboard(res.data ?? res);
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to load accounts dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const kpi = dashboard?.kpi ?? dashboard ?? {};
  const recentPayments = dashboard?.recent_payments ?? [];
  const invoiceDistribution = dashboard?.invoice_status_distribution ?? {};

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts Dashboard" />

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Invoiced"
          value={`AED ${Number(kpi.total_invoiced ?? 0).toLocaleString()}`}
          icon={<HiOutlineDocumentText className="h-8 w-8 text-blue-500" />}
        />
        <StatsCard
          title="Total Collected"
          value={`AED ${Number(kpi.total_collected ?? 0).toLocaleString()}`}
          icon={<HiOutlineBanknotes className="h-8 w-8 text-green-500" />}
        />
        <StatsCard
          title="Outstanding"
          value={`AED ${Number(kpi.outstanding ?? 0).toLocaleString()}`}
          icon={<HiOutlineArrowTrendingUp className="h-8 w-8 text-yellow-500" />}
        />
        <StatsCard
          title="Overdue Count"
          value={kpi.overdue_count ?? 0}
          icon={<HiOutlineExclamationCircle className="h-8 w-8 text-red-500" />}
        />
        <StatsCard
          title="VAT Collected"
          value={`AED ${Number(kpi.vat_collected ?? 0).toLocaleString()}`}
          icon={<HiOutlineReceiptPercent className="h-8 w-8 text-purple-500" />}
        />
      </div>

      {/* Invoice Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(invoiceDistribution).map(([status, count]) => (
            <div key={status} className="border border-gray-200 rounded-lg p-4 text-center">
              <StatusBadge status={status} />
              <p className="text-2xl font-bold text-gray-900 mt-2">{count as number}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
        {recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {payment.payment_number ?? payment.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.invoice_number ?? payment.invoice_id ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      AED {Number(payment.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                      {payment.method ?? payment.payment_method ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent payments.</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'View All Invoices', href: '/accounts/invoices' },
          { label: 'Deposits', href: '/accounts/deposits' },
          { label: 'Toll & Fines', href: '/accounts/toll-fines' },
        ].map((link) => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">{link.label}</span>
            <HiOutlineArrowRight className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
