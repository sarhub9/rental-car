'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerDashboard();
      setDashboard(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCountdown = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Overdue';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {dashboard?.user_name || 'Customer'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here is an overview of your rental activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
              <HiOutlineTruck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Rentals</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard?.active_rentals ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-green-50 rounded-lg">
              <HiOutlineDocumentText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Rentals</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard?.total_rentals ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-amber-50 rounded-lg">
              <HiOutlineCurrencyDollar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Charges</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard?.pending_charges != null
                  ? `QAR ${Number(dashboard.pending_charges).toLocaleString()}`
                  : 'QAR 0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push('/portal/rentals')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <HiOutlineTruck className="h-4 w-4" />
          View Rentals
        </button>
        <button
          onClick={() => router.push('/portal/invoices')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <HiOutlineCurrencyDollar className="h-4 w-4" />
          View Invoices
        </button>
        <button
          onClick={() => router.push('/portal/messages')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <HiOutlineEnvelope className="h-4 w-4" />
          Contact Support
        </button>
      </div>

      {/* Recent Agreements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Agreements</h2>
          <button
            onClick={() => router.push('/portal/rentals')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            View all <HiOutlineArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard?.recent_agreements?.length > 0 ? (
            dashboard.recent_agreements.map((agreement: any) => (
              <div
                key={agreement.id}
                onClick={() => router.push(`/portal/rentals/${agreement.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {agreement.agreement_number}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      agreement.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : agreement.status === 'closed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {agreement.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {agreement.vehicle_make} {agreement.vehicle_model} &mdash;{' '}
                  {agreement.plate_number}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(agreement.start_date).toLocaleDateString()} &ndash;{' '}
                  {new Date(agreement.end_date).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 col-span-2">No recent agreements.</p>
          )}
        </div>
      </div>

      {/* Upcoming Returns */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Returns</h2>
        <div className="space-y-3">
          {dashboard?.upcoming_returns?.length > 0 ? (
            dashboard.upcoming_returns.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.agreement_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.vehicle_make} {item.vehicle_model}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                    <HiOutlineClock className="h-4 w-4" />
                    {getCountdown(item.end_date)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Due: {new Date(item.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No upcoming returns.</p>
          )}
        </div>
      </div>
    </div>
  );
}
