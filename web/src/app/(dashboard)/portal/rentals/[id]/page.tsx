'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineTruck,
  HiOutlineCalendarDays,
  HiOutlineCamera,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agreement, setAgreement] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [agRes, evRes, chRes] = await Promise.all([
        customerPortalService.getCustomerAgreementById(id),
        customerPortalService.getCustomerAgreementEvidence(id),
        customerPortalService.getCustomerAgreementCharges(id),
      ]);
      setAgreement(agRes.data);
      setEvidence(evRes.data?.data || evRes.data || []);
      setCharges(chRes.data?.data || chRes.data || []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load rental details'));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Agreement not found.</p>
        <button
          onClick={() => router.push('/portal/rentals')}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Rentals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/rentals')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {agreement.agreement_number}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(
              agreement.status
            )}`}
          >
            {agreement.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agreement Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="h-4 w-4" />
            Agreement Info
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Agreement #</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.agreement_number}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.agreement_type || '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Total Amount</dt>
              <dd className="text-sm font-medium text-gray-900">
                QAR {Number(agreement.total_amount || 0).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineTruck className="h-4 w-4" />
            Vehicle Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Vehicle</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.vehicle_make} {agreement.vehicle_model}{' '}
                {agreement.vehicle_year || ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Plate Number</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.plate_number}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Color</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.vehicle_color || '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Date / Time Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <HiOutlineCalendarDays className="h-4 w-4" />
            Date &amp; Time
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Start Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(agreement.start_date).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">End Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(agreement.end_date).toLocaleString()}
              </dd>
            </div>
            {agreement.actual_return_date && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Actual Return</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(agreement.actual_return_date).toLocaleString()}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="text-sm font-medium text-gray-900">
                {agreement.duration || '-'} {agreement.duration_unit || 'days'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Related Invoice */}
        {agreement.invoice_id && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HiOutlineCurrencyDollar className="h-4 w-4" />
              Related Invoice
            </h2>
            <button
              onClick={() => router.push(`/portal/invoices/${agreement.invoice_id}`)}
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View Invoice #{agreement.invoice_number || agreement.invoice_id}
              <HiOutlineDocumentText className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Evidence Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineCamera className="h-4 w-4" />
          Evidence Photos
        </h2>
        {evidence.length === 0 ? (
          <p className="text-sm text-gray-500">No evidence photos available.</p>
        ) : (
          <div className="space-y-4">
            {['checkout', 'return'].map((type) => {
              const items = evidence.filter(
                (e) => e.type === type || e.evidence_type === type
              );
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                    {type} Photos
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={item.url || item.file_url}
                          alt={`${type} evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charges Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineCurrencyDollar className="h-4 w-4" />
          Charges Breakdown
        </h2>
        {charges.length === 0 ? (
          <p className="text-sm text-gray-500">No charges recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charges.map((charge, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {charge.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {charge.charge_type || charge.type || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                      QAR {Number(charge.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td
                    colSpan={2}
                    className="px-4 py-2 text-sm font-semibold text-gray-900"
                  >
                    Total
                  </td>
                  <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                    QAR{' '}
                    {charges
                      .reduce((sum, c) => sum + Number(c.amount || 0), 0)
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
