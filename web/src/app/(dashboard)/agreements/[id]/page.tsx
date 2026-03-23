'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HiChevronLeft,
  HiPencilSquare,
  HiArrowRightOnRectangle,
  HiArrowUturnLeft,
  HiUser,
  HiTruck,
  HiCalendarDays,
  HiCurrencyDollar,
  HiCamera,
  HiClock,
  HiDocumentText,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Agreement } from '@/types';

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [agr, ev, ch] = await Promise.allSettled([
          agreementService.getAgreementById(id),
          agreementService.getAgreementEvidence(id),
          agreementService.getAgreementCharges(id),
        ]);
        if (agr.status === 'fulfilled') setAgreement(agr.value.data || agr.value);
        if (ev.status === 'fulfilled') setEvidence(ev.value.data || ev.value);
        if (ch.status === 'fulfilled') setCharges(ch.value.data || ch.value || []);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load agreement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <HiDocumentText className="h-12 w-12 mb-3 text-gray-300" />
        <p className="text-lg font-medium">Agreement not found</p>
        <Link href="/agreements" className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Agreements
        </Link>
      </div>
    );
  }

  const status = agreement.status;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/agreements')}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            <HiChevronLeft className="h-4 w-4" />
            Back to Agreements
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {agreement.agreement_number || `AGR-${String(agreement.id).padStart(5, '0')}`}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {status === 'DRAFT' && (
            <>
              <Link
                href={`/agreements/${id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HiPencilSquare className="h-4 w-4" />
                Edit
              </Link>
              <Link
                href={`/agreements/${id}/checkout`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <HiArrowRightOnRectangle className="h-4 w-4" />
                Proceed to Checkout
              </Link>
            </>
          )}
          {status === 'ACTIVE' && (
            <Link
              href={`/agreements/${id}/return`}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
            >
              <HiArrowUturnLeft className="h-4 w-4" />
              Process Return
            </Link>
          )}
        </div>
      </div>

      {/* Agreement Info */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiDocumentText className="h-5 w-5 text-gray-400" />
          Agreement Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.rental_start_datetime
                ? new Date(agreement.rental_start_datetime).toLocaleString()
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.rental_end_datetime
                ? new Date(agreement.rental_end_datetime).toLocaleString()
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Amount</p>
            <p className="mt-1 text-lg font-bold text-blue-600">
              {agreement.estimated_amount != null
                ? `$${Number(agreement.estimated_amount).toFixed(2)}`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Rate</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.daily_rate != null ? `$${Number(agreement.daily_rate).toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Rate</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.weekly_rate != null ? `$${Number(agreement.weekly_rate).toFixed(2)}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.created_at ? new Date(agreement.created_at).toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {agreement.updated_at ? new Date(agreement.updated_at).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Customer & Vehicle */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiUser className="h-5 w-5 text-gray-400" />
            Customer
          </h2>
          {agreement.customer ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <HiUser className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {agreement.customer.full_name_en} {agreement.customer.full_name_ar}
                  </p>
                  <p className="text-sm text-gray-500">{agreement.customer.email}</p>
                </div>
              </div>
              {agreement.customer.phone_number && (
                <p className="text-sm text-gray-600">Phone: {agreement.customer.phone_number}</p>
              )}
              {agreement.customer.driving_license_number && (
                <p className="text-sm text-gray-600">
                  License: {agreement.customer.driving_license_number}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No customer information</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiTruck className="h-5 w-5 text-gray-400" />
            Vehicle
          </h2>
          {agreement.vehicle ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <HiTruck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {agreement.vehicle.year} {agreement.vehicle.make} {agreement.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-500">{agreement.vehicle.plate_number}</p>
                </div>
              </div>
              {agreement.vehicle.color && (
                <p className="text-sm text-gray-600">Color: {agreement.vehicle.color}</p>
              )}
              {agreement.vehicle.chassis_number && (
                <p className="text-sm text-gray-600">VIN: {agreement.vehicle.chassis_number}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No vehicle information</p>
          )}
        </div>
      </div>

      {/* Evidence Section */}
      {evidence && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiCamera className="h-5 w-5 text-gray-400" />
            Evidence
          </h2>

          <div className="space-y-6">
            {/* Checkout Evidence */}
            {evidence.checkout && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Checkout Evidence
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Odometer</p>
                    <p className="font-semibold">{evidence.checkout.odometer_reading || '-'} mi</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Fuel Level</p>
                    <p className="font-semibold">{evidence.checkout.fuel_level || '-'}</p>
                  </div>
                </div>
                {evidence.checkout.photos && evidence.checkout.photos.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-3 sm:grid-cols-6">
                    {evidence.checkout.photos.map((photo: any, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={photo.url || photo}
                          alt={photo.angle || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Return Evidence */}
            {evidence.return && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Return Evidence
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Odometer</p>
                    <p className="font-semibold">{evidence.return.odometer_reading || '-'} mi</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Fuel Level</p>
                    <p className="font-semibold">{evidence.return.fuel_level || '-'}</p>
                  </div>
                </div>
                {evidence.return.photos && evidence.return.photos.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-3 sm:grid-cols-6">
                    {evidence.return.photos.map((photo: any, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={photo.url || photo}
                          alt={photo.angle || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charges */}
      {charges && charges.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiCurrencyDollar className="h-5 w-5 text-gray-400" />
            Charges
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charges.map((charge: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{charge.description}</td>
                    <td className="py-3 px-4 text-gray-500">{charge.type || charge.charge_type}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${Number(charge.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-3 px-4 font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600 text-lg">
                    ${charges.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {agreement.audit_log && agreement.audit_log.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiClock className="h-5 w-5 text-gray-400" />
            Activity Timeline
          </h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {agreement.audit_log.map((entry: any, idx: number) => (
                <div key={idx} className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
                  <div className="flex-1 rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{entry.action || entry.event}</p>
                      <p className="text-xs text-gray-500">
                        {entry.timestamp || entry.created_at
                          ? new Date(entry.timestamp || entry.created_at).toLocaleString()
                          : ''}
                      </p>
                    </div>
                    {entry.details && (
                      <p className="mt-1 text-sm text-gray-600">{entry.details}</p>
                    )}
                    {entry.user && (
                      <p className="mt-1 text-xs text-gray-400">by {entry.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
