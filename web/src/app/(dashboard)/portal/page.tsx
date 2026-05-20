'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowRight,
  HiOutlineCalendarDays,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

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
      setDashboard(res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  const getCountdown = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return { label: 'Overdue', urgent: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return { label: `${days}d ${hours}h remaining`, urgent: days <= 1 };
    return { label: `${hours}h remaining`, urgent: true };
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
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
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {dashboard?.user_name || 'Customer'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Here is an overview of your rental activity.
            </p>
          </div>
          <button
            onClick={() => router.push('/portal/messages')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
            Contact Support
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <HiOutlineTruck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Rentals</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">
                {dashboard?.active_rentals ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <HiOutlineDocumentText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Rentals</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">
                {dashboard?.total_rentals ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center">
              <HiOutlineCurrencyDollar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Charges</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">
                {dashboard?.pending_charges != null
                  ? `QAR ${Number(dashboard.pending_charges).toLocaleString()}`
                  : 'QAR 0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'My Rentals',
            desc: 'View all your agreements',
            icon: HiOutlineTruck,
            color: 'text-blue-600 bg-blue-50',
            href: '/portal/rentals',
          },
          {
            label: 'My Invoices',
            desc: 'Billing & payment history',
            icon: HiOutlineCurrencyDollar,
            color: 'text-green-600 bg-green-50',
            href: '/portal/invoices',
          },
          {
            label: 'Messages',
            desc: 'Contact support team',
            icon: HiOutlineChatBubbleLeftRight,
            color: 'text-primary-600 bg-primary-50',
            href: '/portal/messages',
          },
        ].map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-500 truncate">{action.desc}</p>
            </div>
            <HiOutlineArrowRight className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Recent Agreements */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Agreements</h2>
          <button
            onClick={() => router.push('/portal/rentals')}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
          >
            View all <HiOutlineArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {dashboard?.recent_agreements?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {dashboard.recent_agreements.map((agreement: any) => (
              <div
                key={agreement.id}
                onClick={() => router.push(`/portal/rentals/${agreement.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineTruck className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {agreement.agreement_number}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {agreement.vehicle_make} {agreement.vehicle_model}
                    {agreement.plate_number && ` · ${agreement.plate_number}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">
                      {agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(agreement.status)}`}>
                    {agreement.status}
                  </span>
                  <HiOutlineArrowRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <HiOutlineDocumentText className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No recent agreements.</p>
          </div>
        )}
      </div>

      {/* Upcoming Returns */}
      {dashboard?.upcoming_returns?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming Returns</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {dashboard.upcoming_returns.map((item: any) => {
              const countdown = getCountdown(item.end_date);
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${countdown.urgent ? 'bg-red-50' : 'bg-amber-50'}`}>
                    {countdown.urgent
                      ? <HiOutlineExclamationCircle className="h-4 w-4 text-red-500" />
                      : <HiOutlineClock className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.agreement_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.vehicle_make} {item.vehicle_model}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${countdown.urgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      <HiOutlineClock className="h-3.5 w-3.5" />
                      {countdown.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      <HiOutlineCalendarDays className="h-3 w-3 inline mr-0.5" />
                      {item.end_date ? new Date(item.end_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
