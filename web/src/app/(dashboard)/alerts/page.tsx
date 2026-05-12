'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBellAlert, HiOutlineExclamationTriangle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/PageHeader';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const TABS = [
  { key: 'all',      label: 'All Alerts' },
  { key: 'vehicle',  label: 'Vehicle Docs' },
  { key: 'customer', label: 'Customer Docs' },
  { key: 'overdue',  label: 'Overdue Returns' },
];

function AlertRow({ icon, title, subtitle, badge, severity }: any) {
  const color = severity === 'EXPIRED'
    ? 'border-l-4 border-red-500 bg-red-50'
    : 'border-l-4 border-amber-400 bg-amber-50';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${color}`}>
      <div className={`mt-0.5 ${severity === 'EXPIRED' ? 'text-red-500' : 'text-amber-500'}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {badge && (
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
          severity === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
        }`}>{badge}</span>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [within, setWithin]   = useState(30);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/alerts', { params: { within_days: within } });
      setData(res.data.data || res.data);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, [within]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const summary = data?.summary || {};

  const vehicleAlerts  = [...(data?.vehicle_documents || []), ...(data?.vehicle_expiry || [])];
  const customerAlerts = data?.customer_documents || [];
  const overdueAlerts  = data?.overdue_returns   || [];

  const allAlerts = [...vehicleAlerts, ...customerAlerts, ...overdueAlerts];

  const displayed = tab === 'vehicle'  ? vehicleAlerts
                  : tab === 'customer' ? customerAlerts
                  : tab === 'overdue'  ? overdueAlerts
                  : allAlerts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <HiOutlineBellAlert className="h-5 w-5 text-red-600" />
          </div>
          <PageHeader title="Alerts & Expiry Tracker" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Alert window:</label>
          <select value={within} onChange={e => setWithin(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical Alerts',    value: summary.critical,        color: 'bg-red-50 border-red-200 text-red-700',    icon: <HiOutlineXCircle className="h-5 w-5" /> },
          { label: 'Vehicle Docs',       value: (summary.vehicle_docs || 0) + (summary.vehicle_expiry || 0),  color: 'bg-orange-50 border-orange-200 text-orange-700', icon: <HiOutlineExclamationTriangle className="h-5 w-5" /> },
          { label: 'Customer Docs',      value: summary.customer_docs,   color: 'bg-amber-50 border-amber-200 text-amber-700',   icon: <HiOutlineExclamationTriangle className="h-5 w-5" /> },
          { label: 'Overdue Returns',    value: summary.overdue_returns, color: 'bg-red-50 border-red-200 text-red-700',    icon: <HiOutlineClock className="h-5 w-5" /> },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
            <div className="flex items-center gap-2 mb-1">{c.icon}<p className="text-xs font-medium">{c.label}</p></div>
            <p className="text-2xl font-bold">{c.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {displayed.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <HiOutlineBellAlert className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No alerts in this category</p>
          </div>
        )}

        {/* Vehicle docs */}
        {(tab === 'all' || tab === 'vehicle') && vehicleAlerts.length > 0 && (
          <>
            {tab === 'all' && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Vehicle Documents</p>}
            {vehicleAlerts.map((a: any, i: number) => (
              <AlertRow key={i}
                icon={<HiOutlineExclamationTriangle className="h-5 w-5" />}
                title={`${a.plate_number ?? a.vehicle_id?.slice(0,8)} — ${a.document_type?.replace(/_/g,' ')}`}
                subtitle={`Expires: ${a.expiry_date ? new Date(a.expiry_date).toLocaleDateString() : '—'}`}
                badge={a.severity === 'EXPIRED' ? 'EXPIRED' : 'Expiring Soon'}
                severity={a.severity}
              />
            ))}
          </>
        )}

        {/* Customer docs */}
        {(tab === 'all' || tab === 'customer') && customerAlerts.length > 0 && (
          <>
            {tab === 'all' && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Customer Documents</p>}
            {customerAlerts.map((a: any, i: number) => (
              <AlertRow key={i}
                icon={<HiOutlineExclamationTriangle className="h-5 w-5" />}
                title={`${a.customer_name} — ${a.document_type}`}
                subtitle={`Phone: ${a.phone_number ?? '—'} · Expires: ${a.expiry_date ? new Date(a.expiry_date).toLocaleDateString() : '—'}`}
                badge={a.severity === 'EXPIRED' ? 'EXPIRED' : 'Expiring Soon'}
                severity={a.severity}
              />
            ))}
          </>
        )}

        {/* Overdue returns */}
        {(tab === 'all' || tab === 'overdue') && overdueAlerts.length > 0 && (
          <>
            {tab === 'all' && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4">Overdue Returns</p>}
            {overdueAlerts.map((a: any, i: number) => (
              <AlertRow key={i}
                icon={<HiOutlineClock className="h-5 w-5" />}
                title={`${a.agreement_number} — ${a.customer_name} · ${a.plate_number}`}
                subtitle={`Was due: ${a.expected_return ? new Date(a.expected_return).toLocaleString() : '—'}`}
                badge={`${a.hours_overdue}h overdue`}
                severity="EXPIRED"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
