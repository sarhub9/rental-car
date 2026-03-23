'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { ratePlanService } from '@/services/rate-plan.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Spinner } from '@/components/Spinner';

export default function RatePlansPage() {
  const router = useRouter();
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatePlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ratePlanService.getRatePlans();
      setRatePlans(res.data ?? res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load rate plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRatePlans();
  }, [fetchRatePlans]);

  const handleToggleActive = async (plan: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (plan.status === "ACTIVE") {
        await ratePlanService.deactivateRatePlan(plan.id);
        toast.success('Rate plan deactivated');
      } else {
        await ratePlanService.updateRatePlan(plan.id, { is_active: true } as any);
        toast.success('Rate plan activated');
      }
      fetchRatePlans();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update rate plan');
    }
  };

  const columns = [
    {
      header: 'Name',
      render: (row: any) => (
        <span className="font-medium text-gray-900">{row.name ?? 'N/A'}</span>
      ),
    },
    {
      header: 'Version',
      render: (row: any) => row.version ?? 1,
    },
    {
      header: 'Daily Rate',
      render: (row: any) =>
        row.daily_rate != null ? `AED ${Number(row.daily_rate).toLocaleString()}` : '-',
    },
    {
      header: 'Weekly Rate',
      render: (row: any) =>
        row.weekly_rate != null ? `AED ${Number(row.weekly_rate).toLocaleString()}` : '-',
    },
    {
      header: 'Monthly Rate',
      render: (row: any) =>
        row.monthly_rate != null ? `AED ${Number(row.monthly_rate).toLocaleString()}` : '-',
    },
    {
      header: 'Included KM',
      render: (row: any) =>
        row.included_km_per_day != null ? `${row.included_km_per_day} km/day` : '-',
    },
    {
      header: 'Extra KM Rate',
      render: (row: any) =>
        row.extra_km_rate != null ? `AED ${Number(row.extra_km_rate).toFixed(2)}` : '-',
    },
    {
      header: 'Deposit',
      render: (row: any) =>
        row.deposit_amount != null ? `AED ${Number(row.deposit_amount).toLocaleString()}` : '-',
    },
    {
      header: 'Active',
      render: (row: any) => (
        <button
          onClick={(e) => handleToggleActive(row, e)}
          className={`flex items-center gap-1 text-sm ${
            row.status === "ACTIVE" ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          {row.status === "ACTIVE" ? (
            <HiOutlineCheckCircle className="h-5 w-5" />
          ) : (
            <HiOutlineXCircle className="h-5 w-5" />
          )}
          {row.status === "ACTIVE" ? 'Yes' : 'No'}
        </button>
      ),
    },
    {
      header: 'Actions',
      render: (row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/rate-plans/${row.id}`);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Rate Plans" />
        <button
          onClick={() => router.push('/rate-plans/create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Create Rate Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={ratePlans}
          onRowClick={(row: any) => router.push(`/rate-plans/${row.id}`)}
          emptyMessage="No rate plans found."
        />
      )}
    </div>
  );
}
