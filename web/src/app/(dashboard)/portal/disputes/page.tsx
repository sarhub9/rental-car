'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamationTriangle,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  open:        { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  'in progress':{ badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  resolved:    { badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  closed:      { badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
};

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDisputes();
  }, [page]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerDisputes();
      if (Array.isArray(res)) {
        setDisputes(res);
        setTotalPages(1);
      } else if (res?.data) {
        setDisputes(Array.isArray(res.data) ? res.data : res.data.data || []);
        setTotalPages(res.data.totalPages || res.totalPages || 1);
      } else {
        setDisputes([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load disputes'));
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = (status: string) =>
    STATUS_STYLES[status?.toLowerCase()] || { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
          <p className="mt-1 text-sm text-gray-500">Raise and track disputes related to your rentals.</p>
        </div>
        <button
          onClick={() => router.push('/portal/disputes/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <HiOutlinePlus className="h-4 w-4" />
          Raise Dispute
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <HiOutlineExclamationTriangle className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">No disputes found.</p>
          <p className="mt-1 text-xs text-gray-400">Raise a dispute if you have an issue with a rental.</p>
          <button
            onClick={() => router.push('/portal/disputes/create')}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Raise your first dispute
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {disputes.map((dispute) => {
              const si = statusInfo(dispute.status);
              return (
                <div
                  key={dispute.id}
                  onClick={() => router.push(`/portal/disputes/${dispute.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HiOutlineExclamationTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {dispute.dispute_number || `#${dispute.id.slice(0, 8)}`}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${si.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />
                        {dispute.status?.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{dispute.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <HiOutlineArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
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
