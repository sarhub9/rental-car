'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/StatsCard';
import { DataTable, Column } from '@/components/DataTable';
import { getAdminDashboard, getVehicleStats } from '@/services/admin.service';
import { getInvoices } from '@/services/invoice.service';
import { getDriverTasks } from '@/services/driver-task.service';
import { getMyCompany, CompanyProfile, getPlans, subscribe, SubscriptionPlan } from '@/services/company.service';
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
  HiOutlineBuildingOffice2,
  HiOutlineMegaphone,
  HiOutlineTag,
  HiOutlineXMark,
  HiOutlineSparkles,
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
// Subscribe Modal
// ============================================================================

function SubscribeModal({ onClose, onSubscribed }: { onClose: () => void; onSubscribed: () => void }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    getPlans()
      .then((data) => setPlans(data.filter((p) => p.is_active)))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      await subscribe({ plan_id: planId });
      toast.success('Successfully subscribed!');
      onSubscribed();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Subscription failed');
    } finally {
      setSubscribing(null);
    }
  };

  const FEATURE_LABELS: Record<string, string> = {
    agreements: 'Agreements',
    invoicing: 'Invoicing',
    disputes: 'Disputes',
    kpi_dashboard: 'KPI Dashboard',
    audit_logs: 'Audit Logs',
    api_access: 'API Access',
    multi_branch: 'Multi-Branch',
    customer_portal: 'Customer Portal',
    online_booking: 'Online Booking',
    mobile_app: 'Mobile App',
    gps_tracking: 'GPS Tracking',
    custom_reports: 'Custom Reports',
    priority_support: 'Priority Support',
    white_label: 'White Label',
  };

  const modalContent = (
    <>
      {/* Backdrop rendered at document.body level — bypasses layout stacking contexts */}
      <div
        className="fixed inset-0 bg-black/60"
        style={{ zIndex: 9998, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      {/* Modal card */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
      >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#0E7490]/10 text-[#0E7490] rounded-xl">
                <HiOutlineSparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0F172A] text-lg">Choose a Plan</h2>
                <p className="text-xs text-[#64748B]">Subscribe to unlock all features</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Billing toggle */}
              <div className="flex items-center bg-[#F1F5F9] rounded-xl p-1 gap-1">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${billing === 'monthly' ? 'bg-white text-[#0E7490] shadow-sm' : 'text-[#64748B]'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${billing === 'annual' ? 'bg-white text-[#0E7490] shadow-sm' : 'text-[#64748B]'}`}
                >
                  Annual
                  <span className="ml-1 text-[10px] text-green-600 font-bold">Save</span>
                </button>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <HiOutlineTag className="w-10 h-10 mx-auto mb-3 text-[#CBD5E1]" />
              <p className="text-sm font-medium">No plans available</p>
              <p className="text-xs mt-1">Contact support to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const price = billing === 'annual' && plan.price_annual > 0 ? plan.price_annual : plan.price_monthly;
                const period = billing === 'annual' ? '/year' : '/month';
                const activeFeatures = Object.entries(plan.features || {})
                  .filter(([, v]) => v)
                  .map(([k]) => FEATURE_LABELS[k] ?? k);
                const isSubscribing = subscribing === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="border border-[#E2E8F0] rounded-2xl p-5 flex flex-col hover:border-[#0E7490] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#0E7490]/10 text-[#0E7490] rounded-xl flex items-center justify-center">
                        <HiOutlineTag className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-[#0F172A] text-sm">{plan.name}</h3>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{plan.description}</p>
                    )}
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        AED {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{period}</span>
                    </div>

                    {/* Limits */}
                    <div className="space-y-1.5 mb-4 text-xs text-[#64748B]">
                      <div className="flex justify-between">
                        <span>Vehicles</span>
                        <span className="font-medium text-[#0F172A]">{plan.max_vehicles ?? '∞'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Users</span>
                        <span className="font-medium text-[#0F172A]">{plan.max_users ?? '∞'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agreements/mo</span>
                        <span className="font-medium text-[#0F172A]">{plan.max_agreements_per_month ?? '∞'}</span>
                      </div>
                    </div>

                    {/* Features */}
                    {activeFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {activeFeatures.map((f) => (
                          <span key={f} className="px-1.5 py-0.5 bg-[#ECFEFF] text-[#0E7490] rounded text-[10px] font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!!subscribing}
                      className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 bg-[#0E7490] hover:bg-[#0C6680]"
                    >
                      {isSubscribing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// ============================================================================
// Admin / Owner Dashboard
// ============================================================================

function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, companyRes] = await Promise.all([
          getAdminDashboard(),
          getMyCompany().catch(() => null),
        ]);
        setData(dashRes.data || dashRes);
        if (companyRes) setCompany(companyRes);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Trial warning
  const trialWarning =
    company?.status === 'TRIAL' && company.trial_ends_at
      ? (() => {
          const daysLeft = Math.ceil(
            (new Date(company.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysLeft > 0 ? daysLeft : 0;
        })()
      : null;

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
      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          onSubscribed={() => {
            setShowSubscribeModal(false);
            getMyCompany().then(setCompany).catch(() => {});
          }}
        />
      )}

      {/* Trial Warning Banner */}
      {trialWarning !== null && trialWarning > 0 && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${trialWarning <= 3 ? 'bg-red-50 border border-red-200' : trialWarning <= 7 ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
          <HiOutlineMegaphone className={`w-6 h-6 shrink-0 ${trialWarning <= 3 ? 'text-red-600' : trialWarning <= 7 ? 'text-orange-600' : 'text-blue-600'}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${trialWarning <= 3 ? 'text-red-800' : trialWarning <= 7 ? 'text-orange-800' : 'text-blue-800'}`}>
              {trialWarning <= 3
                ? `Trial expires in ${trialWarning} day${trialWarning === 1 ? '' : 's'}!`
                : `Trial expires in ${trialWarning} days`}
            </p>
            <p className={`text-xs mt-0.5 ${trialWarning <= 3 ? 'text-red-600' : trialWarning <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
              Subscribe to a plan to continue using all features after your trial ends.
            </p>
          </div>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${trialWarning <= 3 ? 'bg-red-600 text-white hover:bg-red-700' : trialWarning <= 7 ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            View Plans
          </button>
        </div>
      )}
      {trialWarning === 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3 bg-red-50 border border-red-200">
          <HiOutlineExclamationTriangle className="w-6 h-6 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Trial period has ended</p>
            <p className="text-xs text-red-600 mt-0.5">Subscribe to a plan to regain access to all features.</p>
          </div>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      )}

      {/* Company Info Bar */}
      {company && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 bg-[#0E7490]/10 text-[#0E7490] rounded-xl shrink-0">
              <HiOutlineBuildingOffice2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] truncate">{company.name}</p>
              <p className="text-xs text-[#64748B]">
                {company.plan_name || 'No Plan'} &middot; {company.subscription_status || company.status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {company.usage && (
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{company.usage.vehicles_count}</p>
                  <p className="text-xs text-[#64748B]">Vehicles</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{company.usage.users_count}</p>
                  <p className="text-xs text-[#64748B]">Users</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{company.usage.agreements_active}</p>
                  <p className="text-xs text-[#64748B]">Active</p>
                </div>
              </div>
            )}
            {(!company.plan_name || company.status === 'TRIAL') && (
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E7490] text-white rounded-lg text-xs font-semibold hover:bg-[#0C6680] transition-colors"
              >
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                Subscribe
              </button>
            )}
          </div>
        </div>
      )}

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
    if (user?.role === 'SUPER_ADMIN') {
      router.replace('/superadmin');
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
