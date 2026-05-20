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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

function InfoCard({ icon: Icon, iconColor, title, children }: { icon: any; iconColor: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">{value || '—'}</dd>
    </div>
  );
}

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
      setAgreement(agRes);
      setEvidence(Array.isArray(evRes) ? evRes : []);
      setCharges(Array.isArray(chRes) ? chRes : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load rental details'));
    } finally {
      setLoading(false);
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

  const statusStyle = (STATUS_STYLES[agreement.status?.toLowerCase()] || 'bg-blue-100 text-blue-700');
  const chargesTotal = charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/rentals')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{agreement.agreement_number}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
              {agreement.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {agreement.vehicle_make} {agreement.vehicle_model}
            {agreement.plate_number && ` · ${agreement.plate_number}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Agreement Info */}
        <InfoCard icon={HiOutlineDocumentText} iconColor="bg-blue-50 text-blue-600" title="Agreement Info">
          <dl>
            <InfoRow label="Agreement #" value={agreement.agreement_number} />
            <InfoRow label="Type" value={agreement.agreement_type} />
            <InfoRow
              label="Total Amount"
              value={<span className="font-bold text-gray-900">QAR {Number(agreement.total_amount || 0).toLocaleString()}</span>}
            />
          </dl>
        </InfoCard>

        {/* Vehicle Details */}
        <InfoCard icon={HiOutlineTruck} iconColor="bg-gray-100 text-gray-600" title="Vehicle Details">
          <dl>
            <InfoRow
              label="Vehicle"
              value={`${agreement.vehicle_make || ''} ${agreement.vehicle_model || ''} ${agreement.vehicle_year || ''}`.trim()}
            />
            <InfoRow label="Plate Number" value={agreement.plate_number} />
            <InfoRow label="Color" value={agreement.vehicle_color} />
          </dl>
        </InfoCard>

        {/* Date & Time */}
        <InfoCard icon={HiOutlineCalendarDays} iconColor="bg-purple-50 text-purple-600" title="Date & Time">
          <dl>
            <InfoRow
              label="Start Date"
              value={agreement.start_date ? new Date(agreement.start_date).toLocaleString() : '—'}
            />
            <InfoRow
              label="End Date"
              value={agreement.end_date ? new Date(agreement.end_date).toLocaleString() : '—'}
            />
            {agreement.actual_return_date && (
              <InfoRow
                label="Actual Return"
                value={new Date(agreement.actual_return_date).toLocaleString()}
              />
            )}
            <InfoRow label="Duration" value={`${agreement.duration || '—'} ${agreement.duration_unit || 'days'}`} />
          </dl>
        </InfoCard>

        {/* Related Invoice */}
        {agreement.invoice_id && (
          <InfoCard icon={HiOutlineCurrencyDollar} iconColor="bg-green-50 text-green-600" title="Related Invoice">
            <button
              onClick={() => router.push(`/portal/invoices/${agreement.invoice_id}`)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  Invoice #{agreement.invoice_number || agreement.invoice_id.slice(0, 8)}
                </span>
              </div>
              <span className="text-xs text-primary-600 font-medium group-hover:underline">View →</span>
            </button>
          </InfoCard>
        )}
      </div>

      {/* Evidence Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <HiOutlineCamera className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Evidence Photos</h2>
        </div>
        {evidence.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <HiOutlineCamera className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No evidence photos available.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {['checkout', 'return'].map((type) => {
              const items = evidence.filter((e) => e.type === type || e.evidence_type === type);
              if (items.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">
                    {type} Photos
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="aspect-video bg-gray-100 rounded-lg overflow-hidden ring-1 ring-gray-200">
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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <HiOutlineCurrencyDollar className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Charges Breakdown</h2>
        </div>
        {charges.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No charges recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-sm text-gray-900">{charge.description}</td>
                    <td className="py-2.5 text-sm text-gray-500">{charge.charge_type || charge.type || '—'}</td>
                    <td className="py-2.5 text-sm font-medium text-gray-900 text-right">
                      QAR {Number(charge.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="pt-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="pt-3 text-sm font-bold text-gray-900 text-right">
                    QAR {chargesTotal.toLocaleString()}
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
