'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineTruck,
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-50 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
};

export default function MyRentalsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active');
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchAgreements();
  }, [activeTab, page]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerAgreements({ status: activeTab, page, limit: 10 });
      if (Array.isArray(res)) {
        setAgreements(res);
        setTotalPages(1);
      } else if (res?.data) {
        setAgreements(Array.isArray(res.data) ? res.data : res.data.data || []);
        setTotalPages(res.data.totalPages || res.totalPages || 1);
      } else {
        setAgreements([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load rentals'));
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status: string) =>
    STATUS_STYLES[status?.toLowerCase()] || 'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage your rental agreements.</p>
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
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : agreements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <HiOutlineTruck className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">No {activeTab} rentals found.</p>
          <p className="mt-1 text-xs text-gray-400">Your {activeTab} agreements will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                onClick={() => router.push(`/portal/rentals/${agreement.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HiOutlineTruck className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {agreement.agreement_number}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {agreement.vehicle_make} {agreement.vehicle_model}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyle(agreement.status)}`}>
                    {agreement.status}
                  </span>
                </div>

                {agreement.plate_number && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                      {agreement.plate_number}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <HiOutlineCalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span>
                    {agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : '—'}
                    {' '}&ndash;{' '}
                    {agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-base font-bold text-gray-900">
                    QAR {Number(agreement.total_amount || 0).toLocaleString()}
                  </p>
                  <span className="text-xs text-primary-600 font-medium inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View details <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
