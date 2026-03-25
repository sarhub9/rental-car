'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineTruck,
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

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
      const res = await customerPortalService.getCustomerAgreements({
        status: activeTab,
        page,
        limit: 10,
      });

      // Handle response - API returns array directly after our service fix
      if (Array.isArray(res)) {
        setAgreements(res);
        setTotalPages(1);
      } else if (res.data) {
        setAgreements(Array.isArray(res.data) ? res.data : res.data.data || []);
        setTotalPages(res.data.totalPages || res.totalPages || 1);
      } else {
        setAgreements([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your rental agreements.
        </p>
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : agreements.length === 0 ? (
        <div className="text-center py-12">
          <HiOutlineTruck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            No {activeTab} rentals found.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                onClick={() => router.push(`/portal/rentals/${agreement.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {agreement.agreement_number}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {agreement.vehicle_make} {agreement.vehicle_model}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      agreement.status
                    )}`}
                  >
                    {agreement.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                  <HiOutlineTruck className="h-4 w-4 flex-shrink-0" />
                  <span>{agreement.plate_number}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <HiOutlineCalendarDays className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {new Date(agreement.start_date).toLocaleDateString()} &ndash;{' '}
                    {new Date(agreement.end_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    QAR {Number(agreement.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
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
