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
import { extractApiError } from '@/lib/api-error';
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
  HiOutlineChartBarSquare,
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
      toast.error(extractApiError(err, 'Subscription failed'));
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
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [branches, setBranches]     = useState<any[]>([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');

  const loadDashboard = async (branchId?: string, from?: string, to?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (branchId) params.branch_id = branchId;
      if (from)     params.date_from = from;
      if (to)       params.date_to   = to;
      const [dashRes, companyRes, branchRes] = await Promise.all([
        getAdminDashboard(params),
        getMyCompany().catch(() => null),
        import('@/services/branch.service').then(m => m.branchService.listBranches()).catch(() => []),
      ]);
      setData(dashRes.data || dashRes);
      if (companyRes) setCompany(companyRes);
      setBranches(Array.isArray(branchRes) ? branchRes : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const applyFilters = () => loadDashboard(branchFilter || undefined, dateFrom || undefined, dateTo || undefined);

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

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const kpis = [
    { label: 'Active Agreements', value: data.active_agreements ?? 0, icon: <HiOutlineDocumentText className="w-5 h-5" />, color: '#0E7490', bg: 'bg-[#0E7490]/10', href: '/agreements?status=ACTIVE' },
    { label: 'Total Revenue', value: `AED ${(data.total_revenue ?? 0).toLocaleString()}`, icon: <HiOutlineCurrencyDollar className="w-5 h-5" />, color: '#059669', bg: 'bg-emerald-100', href: '/reports?tab=revenue' },
    { label: 'Fleet Utilization', value: `${data.fleet_utilization_percent ?? 0}%`, icon: <HiOutlineTruck className="w-5 h-5" />, color: '#7C3AED', bg: 'bg-violet-100', href: '/reports?tab=fleet' },
    { label: 'Overdue Returns', value: data.overdue_returns ?? 0, icon: <HiOutlineExclamationTriangle className="w-5 h-5" />, color: '#DC2626', bg: 'bg-red-100', href: '/alerts' },
  ];

  const quickActions = [
    { label: 'New Agreement', href: '/agreements/create', icon: <HiOutlineDocumentText className="w-4 h-4" /> },
    { label: 'Add Customer', href: '/customers', icon: <HiOutlineUserGroup className="w-4 h-4" /> },
    { label: 'View Vehicles', href: '/vehicles', icon: <HiOutlineTruck className="w-4 h-4" /> },
    { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {showSubscribeModal && (
        <SubscribeModal
          onClose={() => setShowSubscribeModal(false)}
          onSubscribed={() => { getMyCompany().then(setCompany).catch(() => {}); }}
        />
      )}

      {/* Header */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, var(--sa-sidebar, #0F172A) 0%, #1E293B 100%)' }}>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">{today}</p>
            <h1 className="text-xl font-bold text-white">{company?.name ?? 'Dashboard'}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                company?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                company?.status === 'TRIAL'  ? 'bg-blue-500/20 text-blue-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {company?.subscription_status || company?.status || 'Unknown'}
              </span>
              {company?.plan_name && (
                <span className="text-[11px] text-slate-400">{company.plan_name}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {company?.usage && (
              <div className="hidden sm:flex items-center gap-5 mr-2">
                {[
                  { v: company.usage.vehicles_count, l: 'Vehicles' },
                  { v: company.usage.users_count, l: 'Users' },
                  { v: company.usage.agreements_active, l: 'Active' },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <p className="text-lg font-bold text-white">{s.v}</p>
                    <p className="text-[10px] text-slate-400">{s.l}</p>
                  </div>
                ))}
              </div>
            )}
            {(!company?.plan_name || company?.status === 'TRIAL') && (
              <button onClick={() => setShowSubscribeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                Subscribe
              </button>
            )}
          </div>
        </div>

        {/* Trial banner inside header */}
        {trialWarning !== null && trialWarning <= 7 && (
          <div className={`px-6 py-2.5 flex items-center gap-3 border-t border-white/10 ${trialWarning <= 3 ? 'bg-red-500/20' : 'bg-orange-500/15'}`}>
            <HiOutlineMegaphone className={`w-4 h-4 shrink-0 ${trialWarning <= 3 ? 'text-red-300' : 'text-orange-300'}`} />
            <p className={`text-xs flex-1 ${trialWarning <= 3 ? 'text-red-200' : 'text-orange-200'}`}>
              {trialWarning === 0 ? 'Trial has ended — subscribe to regain access' : `Trial expires in ${trialWarning} day${trialWarning === 1 ? '' : 's'}`}
            </p>
            <button onClick={() => setShowSubscribeModal(true)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold ${trialWarning <= 3 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
              View Plans
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Branch</label>
          <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white min-w-[140px]">
            <option value="">All Branches</option>
            {branches.map((b:any)=><option key={b.id} value={b.id}>{b.branch_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"/>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"/>
        </div>
        <button onClick={applyFilters}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Apply
        </button>
        {(branchFilter||dateFrom||dateTo) && (
          <button onClick={()=>{setBranchFilter('');setDateFrom('');setDateTo('');loadDashboard();}}
            className="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 text-gray-600">
            Clear
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} onClick={()=>router.push(k.href)}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bg}`} style={{ color: k.color }}>
                {k.icon}
              </div>
              <HiOutlineChartBarSquare className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{k.value}</p>
            <p className="text-xs text-[#64748B] mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        {data.monthly_trend && data.monthly_trend.length > 0 ? (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#0F172A]">Monthly Revenue</h2>
              <span className="text-xs text-[#64748B]">Last {data.monthly_trend.length} months</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthly_trend} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '10px', color: '#F8FAFC', fontSize: 12 }} cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="agreements" fill="#0E7490" radius={[4, 4, 0, 0]} name="Agreements" maxBarSize={32} />
                <Bar dataKey="estimated_revenue" fill="#059669" radius={[4, 4, 0, 0]} name="Revenue (AED)" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 flex items-center justify-center min-h-[200px]">
            <div className="text-center text-[#94A3B8]">
              <HiOutlineChartBarSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No chart data yet</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map(a => (
              <a key={a.label} href={a.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all group">
                <div className="w-8 h-8 rounded-lg bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center shrink-0 group-hover:bg-[#0E7490] group-hover:text-white transition-colors">
                  {a.icon}
                </div>
                <span className="text-sm font-medium text-[#374151] group-hover:text-[#0F172A]">{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {(data.recent_activity ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A]">Recent Activity</h2>
          </div>
          <div className="divide-y divide-[#F8FAFC]">
            {(data.recent_activity ?? []).slice(0, 8).map((ev: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                  <HiOutlineClipboardDocumentList className="w-4 h-4 text-[#64748B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">{ev.event_description ?? ev.event_type}</p>
                  {ev.event_timestamp && (
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">{new Date(ev.event_timestamp).toLocaleString()}</p>
                  )}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] shrink-0">{ev.event_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to load fleet stats'));
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
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to load accounts data'));
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
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to load tasks'));
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
    <div className="p-6 w-full">
      <DashboardComponent />
    </div>
  );
}
