'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineXCircle,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { ratePlanService } from '@/services/rate-plan.service';
import { extractApiError } from '@/lib/api-error';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';

export default function RatePlanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [ratePlan, setRatePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    included_km_per_day: '',
    extra_km_rate: '',
    deposit_amount: '',
    fuel_policy: '',
    late_return_rules: '',
    terms_text: '',
  });
  const [addOns, setAddOns] = useState<{ name: string; price: string }[]>([]);

  const fetchRatePlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ratePlanService.getRatePlanById(id as string);
      const plan = res.data ?? res;
      setRatePlan(plan);
      populateForm(plan);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load rate plan'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const populateForm = (plan: any) => {
    setForm({
      name: plan.name ?? '',
      daily_rate: plan.daily_rate?.toString() ?? '',
      weekly_rate: plan.weekly_rate?.toString() ?? '',
      monthly_rate: plan.monthly_rate?.toString() ?? '',
      included_km_per_day: plan.included_km_per_day?.toString() ?? '',
      extra_km_rate: plan.extra_km_rate?.toString() ?? '',
      deposit_amount: plan.deposit_amount?.toString() ?? '',
      fuel_policy: plan.fuel_policy ? JSON.stringify(plan.fuel_policy, null, 2) : '',
      late_return_rules: plan.late_return_rules
        ? JSON.stringify(plan.late_return_rules, null, 2)
        : '',
      terms_text: plan.terms_text ?? '',
    });
    setAddOns(
      (plan.add_ons ?? []).map((a: any) => ({
        name: a.name ?? '',
        price: a.price?.toString() ?? '',
      }))
    );
  };

  useEffect(() => {
    fetchRatePlan();
  }, [fetchRatePlan]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddAddOn = () => {
    setAddOns((prev) => [...prev, { name: '', price: '' }]);
  };

  const handleRemoveAddOn = (idx: number) => {
    setAddOns((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddOnChange = (idx: number, field: 'name' | 'price', value: string) => {
    setAddOns((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSubmitting(true);

      let fuelPolicy: any = undefined;
      if (form.fuel_policy.trim()) {
        try {
          fuelPolicy = JSON.parse(form.fuel_policy);
        } catch {
          toast.error('Invalid JSON for fuel policy');
          return;
        }
      }

      let lateReturnRules: any = undefined;
      if (form.late_return_rules.trim()) {
        try {
          lateReturnRules = JSON.parse(form.late_return_rules);
        } catch {
          toast.error('Invalid JSON for late return rules');
          return;
        }
      }

      const payload: any = {
        name: form.name,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : undefined,
        weekly_rate: form.weekly_rate ? Number(form.weekly_rate) : undefined,
        monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
        included_km_per_day: form.included_km_per_day ? Number(form.included_km_per_day) : undefined,
        extra_km_rate: form.extra_km_rate ? Number(form.extra_km_rate) : undefined,
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : undefined,
        fuel_policy: fuelPolicy,
        late_return_rules: lateReturnRules,
        terms_text: form.terms_text || undefined,
        add_ons: addOns
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name, price: a.price ? Number(a.price) : 0 })),
      };

      await ratePlanService.updateRatePlan(id as string, payload);
      toast.success('Rate plan updated (new version created)');
      setEditing(false);
      fetchRatePlan();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to update rate plan'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await ratePlanService.deactivateRatePlan(id as string);
      toast.success('Rate plan deactivated');
      fetchRatePlan();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to deactivate rate plan'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!ratePlan) {
    return (
      <div className="text-center py-20 text-gray-500">Rate plan not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/rate-plans')} className="text-gray-500 hover:text-gray-700">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={ratePlan.name ?? 'Rate Plan'} />
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            Edit
          </button>
        )}
        {ratePlan.status === "ACTIVE" && (
          <button
            onClick={handleDeactivate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <HiOutlineXCircle className="h-4 w-4" />
            Deactivate
          </button>
        )}
      </div>

      {editing ? (
        /* Edit Mode */
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (AED)</label>
              <input
                type="number"
                step="0.01"
                value={form.daily_rate}
                onChange={(e) => handleChange('daily_rate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (AED)</label>
              <input
                type="number"
                step="0.01"
                value={form.weekly_rate}
                onChange={(e) => handleChange('weekly_rate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (AED)</label>
              <input
                type="number"
                step="0.01"
                value={form.monthly_rate}
                onChange={(e) => handleChange('monthly_rate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Included KM/Day</label>
              <input
                type="number"
                value={form.included_km_per_day}
                onChange={(e) => handleChange('included_km_per_day', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extra KM Rate (AED)</label>
              <input
                type="number"
                step="0.01"
                value={form.extra_km_rate}
                onChange={(e) => handleChange('extra_km_rate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (AED)</label>
              <input
                type="number"
                step="0.01"
                value={form.deposit_amount}
                onChange={(e) => handleChange('deposit_amount', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Policy (JSON)</label>
            <textarea
              value={form.fuel_policy}
              onChange={(e) => handleChange('fuel_policy', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Return Rules (JSON)</label>
            <textarea
              value={form.late_return_rules}
              onChange={(e) => handleChange('late_return_rules', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={form.terms_text}
              onChange={(e) => handleChange('terms_text', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Add-ons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Add-ons</label>
              <button
                type="button"
                onClick={handleAddAddOn}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <HiOutlinePlusCircle className="h-4 w-4" />
                Add Item
              </button>
            </div>
            {addOns.length === 0 ? (
              <p className="text-sm text-gray-500">No add-ons.</p>
            ) : (
              <div className="space-y-2">
                {addOns.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={addon.name}
                      onChange={(e) => handleAddOnChange(idx, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add-on name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={addon.price}
                      onChange={(e) => handleAddOnChange(idx, 'price', e.target.value)}
                      className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Price"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAddOn(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setEditing(false);
                populateForm(ratePlan);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update (New Version)'}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">{ratePlan.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Version</p>
              <p className="text-sm text-gray-900">{ratePlan.version ?? 1}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={ratePlan.status === "ACTIVE" ? 'active' : 'inactive'} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deposit Amount</p>
              <p className="text-sm text-gray-900">
                {ratePlan.deposit_amount != null
                  ? `AED ${Number(ratePlan.deposit_amount).toLocaleString()}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Daily Rate</p>
              <p className="text-sm text-gray-900">
                {ratePlan.daily_rate != null
                  ? `AED ${Number(ratePlan.daily_rate).toLocaleString()}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Weekly Rate</p>
              <p className="text-sm text-gray-900">
                {ratePlan.weekly_rate != null
                  ? `AED ${Number(ratePlan.weekly_rate).toLocaleString()}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Rate</p>
              <p className="text-sm text-gray-900">
                {ratePlan.monthly_rate != null
                  ? `AED ${Number(ratePlan.monthly_rate).toLocaleString()}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Included KM/Day</p>
              <p className="text-sm text-gray-900">
                {ratePlan.included_km_per_day != null ? `${ratePlan.included_km_per_day} km` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Extra KM Rate</p>
              <p className="text-sm text-gray-900">
                {ratePlan.extra_km_rate != null
                  ? `AED ${Number(ratePlan.extra_km_rate).toFixed(2)}`
                  : '-'}
              </p>
            </div>
          </div>

          {ratePlan.fuel_policy && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Fuel Policy</p>
              <pre className="text-sm text-gray-700 bg-gray-50 rounded p-3 overflow-x-auto">
                {typeof ratePlan.fuel_policy === 'string'
                  ? ratePlan.fuel_policy
                  : JSON.stringify(ratePlan.fuel_policy, null, 2)}
              </pre>
            </div>
          )}

          {ratePlan.late_return_rules && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Late Return Rules</p>
              <pre className="text-sm text-gray-700 bg-gray-50 rounded p-3 overflow-x-auto">
                {typeof ratePlan.late_return_rules === 'string'
                  ? ratePlan.late_return_rules
                  : JSON.stringify(ratePlan.late_return_rules, null, 2)}
              </pre>
            </div>
          )}

          {ratePlan.terms_text && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Terms & Conditions</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ratePlan.terms_text}</p>
            </div>
          )}

          {ratePlan.add_ons && ratePlan.add_ons.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Add-ons</p>
              <div className="space-y-1">
                {ratePlan.add_ons.map((addon: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{addon.name}</span>
                    <span className="text-gray-900 font-medium">
                      AED {Number(addon.price ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
