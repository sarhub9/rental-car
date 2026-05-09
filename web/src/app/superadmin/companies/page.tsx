'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlineEye,
} from 'react-icons/hi2';
import { DataTable, Column } from '@/components/DataTable';
import {
  listCompanies,
  updateCompanyStatus,
  SuperAdminCompany,
  CompanyUsage,
} from '@/services/company.service';

export default function SuperAdminCompaniesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [companies, setCompanies] = useState<SuperAdminCompany[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCompanies({
        status: statusFilter || undefined,
        limit,
        offset: page * limit,
      });
      setCompanies(res.items || []);
      setCount(res.count || 0);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleToggleStatus = useCallback(
    async (company: SuperAdminCompany) => {
      const newStatus = company.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      const action = newStatus === 'SUSPENDED' ? 'suspend' : 'activate';

      if (!confirm(`Are you sure you want to ${action} "${company.name}"?`)) return;

      try {
        await updateCompanyStatus(company.id, newStatus);
        toast.success(`Company ${newStatus.toLowerCase()} successfully`);
        fetchCompanies();
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.response?.data?.message || `Failed to ${action} company`;
        toast.error(message);
      }
    },
    [fetchCompanies]
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      TRIAL: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.CANCELLED}`}
      >
        {status}
      </span>
    );
  };

  const getSubStatusBadge = (status?: string) => {
    if (!status) return <span className="text-gray-400 text-xs">—</span>;
    const styles: Record<string, string> = {
      TRIAL: 'bg-blue-50 text-blue-700',
      ACTIVE: 'bg-green-50 text-green-700',
      EXPIRED: 'bg-orange-50 text-orange-700',
      CANCELLED: 'bg-gray-50 text-gray-500',
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.CANCELLED}`}
      >
        {status}
      </span>
    );
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Company',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-[#0F172A]">{row.name as string}</p>
          <p className="text-xs text-[#64748B]">{row.contact_email as string}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: string) => getStatusBadge(v),
    },
    {
      key: 'subscription_status',
      label: 'Subscription',
      render: (v: string) => getSubStatusBadge(v),
    },
    {
      key: 'plan_name',
      label: 'Plan',
      render: (v: string) => v || <span className="text-gray-400">—</span>,
    },
    {
      key: 'usage',
      label: 'Usage',
      render: (_: unknown, row: Record<string, unknown>) => {
        const usage = row.usage as CompanyUsage | undefined;
        if (!usage) return <span className="text-xs text-gray-400">—</span>;
        return (
          <div className="text-xs space-y-0.5">
            <p>{usage.vehicles_count} vehicles</p>
            <p>{usage.users_count} users</p>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Record<string, unknown>) => {
        const company = row as unknown as SuperAdminCompany;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/superadmin/companies/${company.id}`)}
              className="p-1.5 text-[#0E7490] hover:bg-[#0E7490]/10 rounded-lg transition-colors"
              title="View Details"
            >
              <HiOutlineEye size={18} />
            </button>
            <button
              onClick={() => handleToggleStatus(company)}
              className={`p-1.5 rounded-lg transition-colors ${
                company.status === 'SUSPENDED'
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-red-600 hover:bg-red-50'
              }`}
              title={company.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
            >
              {company.status === 'SUSPENDED' ? (
                <HiOutlineCheckCircle size={18} />
              ) : (
                <HiOutlineXCircle size={18} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  if (loading && companies.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Company Management</h1>
          <p className="text-sm text-[#64748B] mt-1">{count} companies total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none bg-white"
        >
          <option value="">All Statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={companies}
        emptyMessage="No companies found"
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-[#64748B]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
