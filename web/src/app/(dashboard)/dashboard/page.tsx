'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/StatsCard';
import { DataTable, Column } from '@/components/DataTable';
import { getAdminDashboard, getVehicleStats } from '@/services/admin.service';
import { getInvoices } from '@/services/invoice.service';
import { getDriverTasks } from '@/services/driver-task.service';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlineWrenchScrewdriver,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePlayCircle,
  HiOutlineBanknotes,
  HiOutlineReceiptPercent,
  HiOutlineArrowTrendingUp,
  HiOutlineShieldExclamation,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import type {
  AdminDashboardData,
  VehicleTask,
  UserRole,
} from '@/types';

// ============================================================================
// Admin / Owner Dashboard
// ============================================================================

function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminDashboard();
        setData(res.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activityColumns: Column[] = useMemo(
    () => [
      { key: 'event_type', label: 'Event' },
      { key: 'event_description', label: 'Description' },
      {
        key: 'event_timestamp',
        label: 'Time',
        render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
      },
    ],
    []
  );

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState message="No dashboard data available" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Admin Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">Overview of your rental operations</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Agreements"
          value={data.active_agreements}
          icon={<HiOutlineDocumentText size={22} />}
          color="#0E7490"
        />
        <StatsCard
          title="Total Revenue"
          value={`AED ${(data.total_revenue ?? 0).toLocaleString()}`}
          icon={<HiOutlineCurrencyDollar size={22} />}
          color="#059669"
        />
        <StatsCard
          title="Fleet Utilization"
          value={`${data.fleet_utilization_percent ?? 0}%`}
          icon={<HiOutlineTruck size={22} />}
          color="#7C3AED"
        />
        <StatsCard
          title="Overdue Returns"
          value={data.overdue_returns}
          icon={<HiOutlineExclamationTriangle size={22} />}
          color="#DC2626"
        />
      </div>

      {/* Monthly Trend Chart */}
      {data.monthly_trend && data.monthly_trend.length > 0 && (
        <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Monthly Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.monthly_trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  background: '#0F172A',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="agreements" fill="#0E7490" radius={[4, 4, 0, 0]} name="Agreements" />
              <Bar
                dataKey="estimated_revenue"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                name="Revenue (AED)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Recent Activity</h2>
        <DataTable
          columns={activityColumns}
          data={data.recent_activity ?? []}
          emptyMessage="No recent activity"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Front Desk Dashboard
// ============================================================================

function FrontDeskDashboard() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'New Agreement',
      description: 'Create a new rental agreement',
      icon: <HiOutlinePlusCircle size={28} />,
      href: '/agreements/new',
      color: '#0E7490',
    },
    {
      title: 'Search Customer',
      description: 'Find customer by name or phone',
      icon: <HiOutlineUserGroup size={28} />,
      href: '/customers',
      color: '#7C3AED',
    },
    {
      title: 'Search Vehicle',
      description: 'Check vehicle availability',
      icon: <HiOutlineMagnifyingGlass size={28} />,
      href: '/vehicles',
      color: '#059669',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Front Desk</h1>
        <p className="text-sm text-[#64748B] mt-1">Quick access to common operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-3 bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-6 hover:shadow-md hover:border-[#0E7490]/30 transition-all text-center group"
          >
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${action.color}15`, color: action.color }}
            >
              {action.icon}
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">{action.title}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Fleet Manager Dashboard
// ============================================================================

function FleetManagerDashboard() {
  const [stats, setStats] = useState<{ by_status: Record<string, number>; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getVehicleStats();
        setStats(res.data);
      } catch {
        toast.error('Failed to load fleet stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    AVAILABLE: {
      bg: '#DCFCE7',
      text: '#166534',
      icon: <HiOutlineCheckCircle size={22} />,
    },
    RENTED: {
      bg: '#DBEAFE',
      text: '#1E40AF',
      icon: <HiOutlineDocumentText size={22} />,
    },
    MAINTENANCE: {
      bg: '#FEF3C7',
      text: '#92400E',
      icon: <HiOutlineWrenchScrewdriver size={22} />,
    },
    OUT_OF_SERVICE: {
      bg: '#FEE2E2',
      text: '#991B1B',
      icon: <HiOutlineExclamationTriangle size={22} />,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Fleet Management</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {stats ? `${stats.total} total vehicles in fleet` : 'Fleet overview'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats &&
          Object.entries(stats.by_status).map(([status, count]) => {
            const style = statusColors[status] || {
              bg: '#F1F5F9',
              text: '#475569',
              icon: <HiOutlineTruck size={22} />,
            };
            return (
              <div
                key={status}
                className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">
                      {status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-[#0F172A] mt-1">{count}</p>
                  </div>
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-xl"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {style.icon}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Alerts section */}
      <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineShieldExclamation size={20} className="text-orange-500" />
          <h2 className="text-lg font-semibold text-[#0F172A]">Expiring Documents</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <HiOutlineCalendarDays size={24} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Registration Expiry</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Check vehicles with upcoming registration renewals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <HiOutlineCalendarDays size={24} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Insurance Expiry</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Check vehicles with upcoming insurance renewals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Accounts Dashboard
// ============================================================================

function AccountsDashboard() {
  const [data, setData] = useState<{
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    overdue_count: number;
    recent_payments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Use admin dashboard + invoices to build accounts view
        const [dashRes, invRes] = await Promise.all([
          getAdminDashboard(),
          getInvoices({ limit: 10 }),
        ]);

        const dash = dashRes.data;
        const invoices = invRes.data?.items ?? invRes.data ?? [];

        // Compute totals from available data
        let totalInvoiced = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;
        let overdueCount = 0;

        if (Array.isArray(invoices)) {
          invoices.forEach((inv: any) => {
            totalInvoiced += inv.total_amount ?? 0;
            totalCollected += inv.amount_paid ?? 0;
            totalOutstanding += inv.balance_due ?? 0;
            if (inv.status === 'OVERDUE') overdueCount++;
          });
        }

        setData({
          total_invoiced: totalInvoiced || dash.total_revenue || 0,
          total_collected: totalCollected,
          total_outstanding: totalOutstanding,
          overdue_count: overdueCount,
          recent_payments: invoices.slice(0, 5),
        });
      } catch {
        toast.error('Failed to load accounts data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const invoiceColumns: Column[] = useMemo(
    () => [
      { key: 'invoice_number', label: 'Invoice #' },
      {
        key: 'total_amount',
        label: 'Amount',
        render: (v: number) => `AED ${(v ?? 0).toLocaleString()}`,
      },
      {
        key: 'balance_due',
        label: 'Balance',
        render: (v: number) => `AED ${(v ?? 0).toLocaleString()}`,
      },
      {
        key: 'status',
        label: 'Status',
        render: (v: string) => {
          const colors: Record<string, string> = {
            PAID: 'bg-green-100 text-green-800',
            ISSUED: 'bg-blue-100 text-blue-800',
            OVERDUE: 'bg-red-100 text-red-800',
            PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
            DRAFT: 'bg-gray-100 text-gray-800',
            VOIDED: 'bg-gray-100 text-gray-500',
          };
          return (
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                colors[v] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {v}
            </span>
          );
        },
      },
      {
        key: 'due_date',
        label: 'Due Date',
        render: (v: string) => (v ? new Date(v).toLocaleDateString() : '—'),
      },
    ],
    []
  );

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState message="No accounts data available" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Accounts</h1>
        <p className="text-sm text-[#64748B] mt-1">Financial overview and invoice tracking</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Invoiced"
          value={`AED ${data.total_invoiced.toLocaleString()}`}
          icon={<HiOutlineReceiptPercent size={22} />}
          color="#0E7490"
        />
        <StatsCard
          title="Collected"
          value={`AED ${data.total_collected.toLocaleString()}`}
          icon={<HiOutlineBanknotes size={22} />}
          color="#059669"
        />
        <StatsCard
          title="Outstanding"
          value={`AED ${data.total_outstanding.toLocaleString()}`}
          icon={<HiOutlineArrowTrendingUp size={22} />}
          color="#D97706"
        />
        <StatsCard
          title="Overdue Invoices"
          value={data.overdue_count}
          icon={<HiOutlineExclamationTriangle size={22} />}
          color="#DC2626"
        />
      </div>

      {/* Recent Invoices */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Recent Invoices</h2>
        <DataTable
          columns={invoiceColumns}
          data={data.recent_payments}
          emptyMessage="No recent invoices"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Driver / Recovery Dashboard
// ============================================================================

function DriverDashboard() {
  const [tasks, setTasks] = useState<VehicleTask[]>([]);
  const [stats, setStats] = useState({ completed_today: 0, pending: 0, in_progress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDriverTasks({ limit: 20 });
        const items: VehicleTask[] = res.data?.items ?? res.data ?? [];
        setTasks(items);

        // Compute stats from task data
        let completedToday = 0;
        let pending = 0;
        let inProgress = 0;
        const today = new Date().toISOString().split('T')[0];

        items.forEach((task) => {
          if (task.status === 'COMPLETED' && task.completed_at?.startsWith(today)) {
            completedToday++;
          } else if (task.status === 'ASSIGNED') {
            pending++;
          } else if (task.status === 'IN_PROGRESS') {
            inProgress++;
          }
        });

        setStats({ completed_today: completedToday, pending, in_progress: inProgress });
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const taskColumns: Column[] = useMemo(
    () => [
      { key: 'task_type', label: 'Type' },
      {
        key: 'priority',
        label: 'Priority',
        render: (v: string) => {
          const colors: Record<string, string> = {
            NORMAL: 'bg-gray-100 text-gray-800',
            URGENT: 'bg-orange-100 text-orange-800',
            CRITICAL: 'bg-red-100 text-red-800',
          };
          return (
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                colors[v] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {v}
            </span>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (v: string) => {
          const colors: Record<string, string> = {
            ASSIGNED: 'bg-blue-100 text-blue-800',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
            COMPLETED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-gray-100 text-gray-500',
          };
          return (
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                colors[v] ?? 'bg-gray-100 text-gray-800'
              }`}
            >
              {v?.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      { key: 'customer_name', label: 'Customer' },
      { key: 'plate_number', label: 'Vehicle' },
      {
        key: 'scheduled_at',
        label: 'Scheduled',
        render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
      },
    ],
    []
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Driver Tasks</h1>
        <p className="text-sm text-[#64748B] mt-1">Your delivery, pickup, and recovery tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Completed Today"
          value={stats.completed_today}
          icon={<HiOutlineCheckCircle size={22} />}
          color="#059669"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={<HiOutlineClock size={22} />}
          color="#D97706"
        />
        <StatsCard
          title="In Progress"
          value={stats.in_progress}
          icon={<HiOutlinePlayCircle size={22} />}
          color="#0E7490"
        />
      </div>

      {/* Task List */}
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-3">Task List</h2>
        <DataTable columns={taskColumns} data={tasks} emptyMessage="No tasks assigned" />
      </div>
    </div>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-64 bg-slate-200 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#CBD5E1] p-5 h-28" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#CBD5E1] p-5 h-80" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <HiOutlineClipboardDocumentList size={48} className="text-[#CBD5E1] mb-4" />
      <p className="text-[#64748B] text-sm">{message}</p>
    </div>
  );
}

// ============================================================================
// Main Dashboard Page
// ============================================================================

const ROLE_DASHBOARDS: Record<UserRole, () => React.ReactElement> = {
  SUPER_ADMIN: AdminDashboard,
  OWNER_ADMIN: AdminDashboard,
  FRONT_DESK: FrontDeskDashboard,
  FLEET_MANAGER: FleetManagerDashboard,
  ACCOUNTS: AccountsDashboard,
  DRIVER_RECOVERY: DriverDashboard,
  RENTAL_CUSTOMER: () => <></>, // redirect handled below
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role === 'RENTAL_CUSTOMER') {
      router.replace('/portal');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === 'RENTAL_CUSTOMER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#0E7490]/30 border-t-[#0E7490] rounded-full animate-spin" />
      </div>
    );
  }

  const DashboardComponent = ROLE_DASHBOARDS[user.role] ?? AdminDashboard;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <DashboardComponent />
    </div>
  );
}
