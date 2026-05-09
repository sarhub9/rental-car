'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlineBuildingOffice2, HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineTruck, HiOutlineUserGroup, HiOutlineDocumentText,
  HiOutlineCalendarDays, HiOutlineIdentification, HiOutlineMapPin,
  HiOutlineClipboardDocumentList, HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import { getCompanyById, updateCompanyStatus, SuperAdminCompany } from '@/services/company.service';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  TRIAL:     { label: 'Trial',     bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CANCELLED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function SuperAdminCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<SuperAdminCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyById(params.id);
      setCompany(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) fetchCompany(); }, [fetchCompany, params.id]);

  const handleToggleStatus = async () => {
    if (!company) return;
    const newStatus = company.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const action = newStatus === 'SUSPENDED' ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${company.name}"?`)) return;
    setToggling(true);
    try {
      const updated = await updateCompanyStatus(company.id, newStatus);
      setCompany(updated);
      toast.success(`Company ${newStatus.toLowerCase()} successfully`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action} company`);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center py-20">
        <HiOutlineBuildingOffice2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600">Company not found</p>
        <Link href="/superadmin/companies" className="text-[#0E7490] text-sm mt-2 inline-block hover:underline">
          Back to companies
        </Link>
      </div>
    );
  }

  const usage = company.usage;
  const initials = company.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'CO';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Back */}
      <Link href="/superadmin/companies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Companies
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top color bar */}
        <div className="h-2 bg-gradient-to-r from-[#0E7490] to-[#155E75]" />
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0E7490] to-[#155E75] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <StatusBadge status={company.status} />
                {company.subscription_status && company.subscription_status !== company.status && (
                  <StatusBadge status={company.subscription_status} />
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1 font-mono">{company.id}</p>
              <div className="flex items-center gap-4 mt-2">
                {company.contact_email && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <HiOutlineEnvelope className="w-3.5 h-3.5" /> {company.contact_email}
                  </span>
                )}
                {company.phone_number && (
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <HiOutlineDevicePhoneMobile className="w-3.5 h-3.5" /> {company.phone_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleToggleStatus} disabled={toggling}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
              company.status === 'SUSPENDED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}>
            {toggling ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : company.status === 'SUSPENDED' ? (
              <HiOutlineCheckCircle className="w-4 h-4" />
            ) : (
              <HiOutlineXCircle className="w-4 h-4" />
            )}
            {company.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineTruck} label="Vehicles" value={usage?.vehicles_count ?? '—'}
          color="bg-blue-50 text-blue-600" />
        <StatCard icon={HiOutlineUserGroup} label="Staff Users" value={usage?.users_count ?? '—'}
          color="bg-purple-50 text-purple-600" />
        <StatCard icon={HiOutlineDocumentText} label="Total Agreements" value={usage?.agreements_total ?? '—'}
          color="bg-teal-50 text-teal-600" />
        <StatCard icon={HiOutlineCheckCircle} label="Active Agreements" value={usage?.agreements_active ?? '—'}
          color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Company Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#0E7490]/10 flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="w-4 h-4 text-[#0E7490]" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Company Information</h2>
          </div>
          <InfoRow icon={HiOutlineBuildingOffice2} label="Company Name" value={company.name} />
          <InfoRow icon={HiOutlineEnvelope} label="Contact Email" value={company.contact_email} />
          <InfoRow icon={HiOutlineDevicePhoneMobile} label="Phone Number" value={company.phone_number} />
          <InfoRow icon={HiOutlineIdentification} label="Trade License" value={company.trade_license_number} />
          <InfoRow icon={HiOutlineMapPin} label="Address" value={(company as any).address} />
          <InfoRow icon={HiOutlineCalendarDays} label="Registered On"
            value={company.created_at ? new Date(company.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined} />
        </div>

        {/* Subscription & Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <HiOutlineCog6Tooth className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Subscription & Plan</h2>
          </div>

          <div className="space-y-3">
            {/* Plan */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="text-sm font-semibold text-gray-900">
                {company.plan_name || <span className="text-gray-400 font-normal">No plan</span>}
              </span>
            </div>
            {/* Company Status */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Company Status</span>
              <StatusBadge status={company.status} />
            </div>
            {/* Subscription Status */}
            {company.subscription_status && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Subscription</span>
                <StatusBadge status={company.subscription_status} />
              </div>
            )}
            {/* Trial ends */}
            {company.trial_ends_at && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Trial Ends</span>
                <span className={`text-sm font-medium ${new Date(company.trial_ends_at) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(company.trial_ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {new Date(company.trial_ends_at) < new Date() && ' (Expired)'}
                </span>
              </div>
            )}
            {/* Days since registered */}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">Days Active</span>
              <span className="text-sm font-semibold text-[#0E7490]">
                {Math.floor((Date.now() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {company.status === 'SUSPENDED' ? 'Reactivate this company' : 'Suspend this company'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {company.status === 'SUSPENDED'
                ? 'Allow this company to access the platform again.'
                : 'Block this company from accessing the platform. Their data will be preserved.'}
            </p>
          </div>
          <button onClick={handleToggleStatus} disabled={toggling}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
              company.status === 'SUSPENDED'
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}>
            {company.status === 'SUSPENDED' ? 'Activate Company' : 'Suspend Company'}
          </button>
        </div>
      </div>

    </div>
  );
}
