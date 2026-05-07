'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { getCompanyById, updateCompanyStatus, SuperAdminCompany, CompanyUsage } from '@/services/company.service';

export default function SuperAdminCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [company, setCompany] = useState<SuperAdminCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompanyById(params.id);
      setCompany(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to load company';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchCompany();
  }, [fetchCompany, params.id]);

  const handleToggleStatus = useCallback(async () => {
    if (!company) return;
    const newStatus = company.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const action = newStatus === 'SUSPENDED' ? 'suspend' : 'activate';

    if (!confirm(`Are you sure you want to ${action} "${company.name}"?`)) return;

    try {
      const updated = await updateCompanyStatus(company.id, newStatus);
      setCompany(updated);
      toast.success(`Company ${newStatus.toLowerCase()} successfully`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.response?.data?.message || `Failed to ${action} company`;
      toast.error(message);
    }
  }, [company]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      TRIAL: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.CANCELLED}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#64748B]">Company not found.</p>
        <Link href="/super-admin/companies" className="text-[#0E7490] text-sm mt-2 inline-block hover:underline">
          Back to companies list
        </Link>
      </div>
    );
  }

  const usage = company.usage;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/companies"
          className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiOutlineArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0F172A]">{company.name}</h1>
            {getStatusBadge(company.status)}
          </div>
          <p className="text-sm text-[#64748B] mt-1">Tenant ID: {company.id}</p>
        </div>
        <button
          onClick={handleToggleStatus}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            company.status === 'SUSPENDED'
              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          }`}
        >
          {company.status === 'SUSPENDED' ? 'Activate Company' : 'Suspend Company'}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company Info */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Company Info</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HiOutlineBuildingOffice2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-[#0F172A]">{company.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineEnvelope className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-[#0F172A]">{company.contact_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineDevicePhoneMobile className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-[#0F172A]">{company.phone_number}</span>
            </div>
            {company.trade_license_number && (
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-[#0F172A]">License: {company.trade_license_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Subscription</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Plan</span>
              <span className="text-sm font-semibold text-[#0F172A]">{company.plan_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Status</span>
              {company.subscription_status && (
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  company.subscription_status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  company.subscription_status === 'TRIAL' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {company.subscription_status}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Trial Ends</span>
              <span className="text-sm text-[#0F172A]">
                {company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Created</span>
              <span className="text-sm text-[#0F172A]">
                {new Date(company.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Usage</h3>
          {usage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineTruck className="w-4 h-4 text-[#0E7490]" />
                  <span className="text-sm text-[#64748B]">Vehicles</span>
                </div>
                <span className="text-lg font-bold text-[#0F172A]">{usage.vehicles_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineUserGroup className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm text-[#64748B]">Users</span>
                </div>
                <span className="text-lg font-bold text-[#0F172A]">{usage.users_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4 text-[#059669]" />
                  <span className="text-sm text-[#64748B]">Total Agreements</span>
                </div>
                <span className="text-lg font-bold text-[#0F172A]">{usage.agreements_total}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-[#64748B]">Active Agreements</span>
                </div>
                <span className="text-lg font-bold text-[#0F172A]">{usage.agreements_active}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Usage data unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
