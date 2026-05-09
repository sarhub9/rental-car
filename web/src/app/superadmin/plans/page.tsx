'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineTag,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import {
  getSuperAdminPlans,
  createSuperAdminPlan,
  updateSuperAdminPlan,
  toggleSuperAdminPlan,
  SubscriptionPlan,
  PlanPayload,
} from '@/services/company.service';

// ─── helpers ──────────────────────────────────────────────────────────────────

function emptyForm(): PlanPayload {
  return {
    name: '',
    description: '',
    price_monthly: 0,
    price_annual: 0,
    max_vehicles: null,
    max_users: null,
    max_agreements_per_month: null,
    features: {},
    sort_order: 0,
  };
}

const FEATURE_PRESETS = [
  { key: 'agreements', label: 'Agreements' },
  { key: 'invoicing', label: 'Invoicing' },
  { key: 'disputes', label: 'Disputes' },
  { key: 'kpi_dashboard', label: 'KPI Dashboard' },
  { key: 'audit_logs', label: 'Audit Logs' },
  { key: 'api_access', label: 'API Access' },
  { key: 'multi_branch', label: 'Multi-Branch' },
  { key: 'customer_portal', label: 'Customer Portal' },
];

// ─── Plan Card ─────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onToggle,
}: {
  plan: SubscriptionPlan;
  onEdit: (p: SubscriptionPlan) => void;
  onToggle: (p: SubscriptionPlan) => void;
}) {
  const activeFeatures = Object.entries(plan.features || {})
    .filter(([, v]) => v)
    .map(([k]) => FEATURE_PRESETS.find((f) => f.key === k)?.label ?? k);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm flex flex-col transition-all ${
        plan.is_active ? 'border-[#CBD5E1]' : 'border-dashed border-gray-300 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-[#F1F5F9]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                plan.is_active ? 'bg-[#0E7490]/10 text-[#0E7490]' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <HiOutlineTag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A] text-sm">{plan.name}</h3>
              {plan.description && (
                <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{plan.description}</p>
              )}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
              plan.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {plan.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Pricing */}
      <div className="px-5 py-4 border-b border-[#F1F5F9]">
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-[#0F172A]">
            AED {(plan.price_monthly ?? 0).toLocaleString()}
          </span>
          <span className="text-xs text-[#94A3B8] mb-1">/month</span>
        </div>
        {plan.price_annual > 0 && (
          <p className="text-xs text-[#64748B] mt-0.5">
            AED {(plan.price_annual ?? 0).toLocaleString()}/year
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="px-5 py-3 border-b border-[#F1F5F9] space-y-1.5">
        <LimitRow
          icon={<HiOutlineTruck className="w-3.5 h-3.5" />}
          label="Vehicles"
          value={plan.max_vehicles}
        />
        <LimitRow
          icon={<HiOutlineUsers className="w-3.5 h-3.5" />}
          label="Users"
          value={plan.max_users}
        />
        <LimitRow
          icon={<HiOutlineDocumentText className="w-3.5 h-3.5" />}
          label="Agreements/mo"
          value={plan.max_agreements_per_month}
        />
      </div>

      {/* Features */}
      {activeFeatures.length > 0 && (
        <div className="px-5 py-3 border-b border-[#F1F5F9]">
          <div className="flex flex-wrap gap-1.5">
            {activeFeatures.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 bg-[#ECFEFF] text-[#0E7490] rounded text-[10px] font-medium"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 flex gap-2 mt-auto">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-colors"
        >
          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onToggle(plan)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
            plan.is_active
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          }`}
        >
          {plan.is_active ? (
            <>
              <HiOutlineNoSymbol className="w-3.5 h-3.5" />
              Disable
            </>
          ) : (
            <>
              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
              Enable
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LimitRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-[#64748B]">
        {icon}
        {label}
      </span>
      <span className="font-medium text-[#0F172A]">
        {value === null || value === undefined ? 'Unlimited' : value.toLocaleString()}
      </span>
    </div>
  );
}

// ─── Plan Drawer ───────────────────────────────────────────────────────────

function PlanDrawer({
  plan,
  onClose,
  onSaved,
}: {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSaved: (p: SubscriptionPlan) => void;
}) {
  const isEdit = !!plan;
  const [form, setForm] = useState<PlanPayload>(
    plan
      ? {
          name: plan.name,
          description: plan.description ?? '',
          price_monthly: plan.price_monthly,
          price_annual: plan.price_annual ?? 0,
          max_vehicles: plan.max_vehicles,
          max_users: plan.max_users,
          max_agreements_per_month: plan.max_agreements_per_month,
          features: { ...(plan.features ?? {}) },
          sort_order: plan.sort_order ?? 0,
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof PlanPayload, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setNum = (key: keyof PlanPayload, raw: string) => {
    const v = raw === '' ? null : Number(raw);
    set(key, v);
  };

  const toggleFeature = (key: string) =>
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features?.[key] },
    }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (!form.price_monthly && form.price_monthly !== 0) {
      toast.error('Monthly price is required');
      return;
    }
    setSaving(true);
    try {
      const saved = isEdit
        ? await updateSuperAdminPlan(plan!.id, form)
        : await createSuperAdminPlan(form);
      toast.success(isEdit ? 'Plan updated' : 'Plan created');
      onSaved(saved);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0E7490]/10 text-[#0E7490]">
              <HiOutlineTag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0F172A] text-sm">
                {isEdit ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isEdit ? `Editing: ${plan!.name}` : 'Add a new subscription plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Basic Info
            </h3>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Professional"
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Brief description of this plan..."
                rows={2}
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => set('sort_order', Number(e.target.value))}
                className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Pricing (AED)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Monthly Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">
                    AED
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.price_monthly}
                    onChange={(e) => set('price_monthly', Number(e.target.value))}
                    className="w-full border border-[#D1D5DB] rounded-xl pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Annual Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">
                    AED
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form.price_annual ?? 0}
                    onChange={(e) => set('price_annual', Number(e.target.value))}
                    className="w-full border border-[#D1D5DB] rounded-xl pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Limits */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Limits (leave blank for unlimited)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Vehicles
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_vehicles ?? ''}
                  onChange={(e) => setNum('max_vehicles', e.target.value)}
                  placeholder="∞"
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Users
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_users ?? ''}
                  onChange={(e) => setNum('max_users', e.target.value)}
                  placeholder="∞"
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1">
                  Agreements
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.max_agreements_per_month ?? ''}
                  onChange={(e) => setNum('max_agreements_per_month', e.target.value)}
                  placeholder="∞"
                  className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              Features
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_PRESETS.map((f) => {
                const enabled = !!(form.features?.[f.key]);
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleFeature(f.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      enabled
                        ? 'bg-[#ECFEFF] border-[#0E7490] text-[#0E7490]'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                        enabled ? 'bg-[#0E7490] border-[#0E7490]' : 'border-[#D1D5DB]'
                      }`}
                    >
                      {enabled && (
                        <svg
                          className="w-2 h-2 text-white"
                          viewBox="0 0 10 10"
                          fill="none"
                        >
                          <path
                            d="M1.5 5L4 7.5L8.5 2.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#F8FAFC] text-[#374151] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes' : 'Create Plan'
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerPlan, setDrawerPlan] = useState<SubscriptionPlan | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getSuperAdminPlans();
      setPlans(data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (plan: SubscriptionPlan) => {
    try {
      const updated = await toggleSuperAdminPlan(plan.id);
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.is_active ? 'Plan enabled' : 'Plan disabled');
    } catch {
      toast.error('Failed to update plan status');
    }
  };

  const handleSaved = (saved: SubscriptionPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setDrawerPlan(null);
  };

  const activePlan = drawerPlan === 'new' ? null : drawerPlan;

  const activePlans = plans.filter((p) => p.is_active);
  const inactivePlans = plans.filter((p) => !p.is_active);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Subscription Plans</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Manage plans that companies can subscribe to
          </p>
        </div>
        <button
          onClick={() => setDrawerPlan('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm"
          style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}
        >
          <HiOutlinePlusCircle className="w-4 h-4" />
          New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Plans', value: plans.length, color: 'bg-[#0E7490]/10 text-[#0E7490]' },
          { label: 'Active Plans', value: activePlans.length, color: 'bg-green-100 text-green-700' },
          { label: 'Inactive Plans', value: inactivePlans.length, color: 'bg-gray-100 text-gray-500' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-sm"
          >
            <p className="text-xs text-[#64748B] font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E2E8F0] h-72 animate-pulse"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#CBD5E1] py-16">
          <HiOutlineTag className="w-10 h-10 text-[#CBD5E1] mb-3" />
          <p className="text-sm font-medium text-[#64748B]">No plans yet</p>
          <p className="text-xs text-[#94A3B8] mt-1 mb-4">
            Create your first subscription plan
          </p>
          <button
            onClick={() => setDrawerPlan('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}
          >
            <HiOutlinePlusCircle className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activePlans.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Active ({activePlans.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activePlans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    onEdit={setDrawerPlan}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}
          {inactivePlans.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Inactive ({inactivePlans.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {inactivePlans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    onEdit={setDrawerPlan}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      {drawerPlan !== null && (
        <PlanDrawer
          plan={activePlan}
          onClose={() => setDrawerPlan(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
