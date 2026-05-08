'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { ratePlanService } from '@/services/rate-plan.service';
import type { CreateRatePlanPayload } from '@/services/rate-plan.service';
import { PageHeader } from '@/components/PageHeader';
import { cleanPayload } from '@/lib/clean-payload';

export default function CreateRatePlanPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    included_km_per_day: '',
    extra_km_rate: '',
    deposit_amount: '',
    terms_text: '',
  });

  // Fuel policy friendly fields
  const [fuelType, setFuelType] = useState('full_to_full');
  const [fuelChargePerUnit, setFuelChargePerUnit] = useState('100');

  // Late return rules friendly fields
  const [gracePeriodHours, setGracePeriodHours] = useState('2');
  const [hourlyCharge, setHourlyCharge] = useState('50');
  const [dailyCap, setDailyCap] = useState('150');

  const [addOns, setAddOns] = useState<{ name: string; price: string }[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSubmitting(true);

      const fuelPolicy = {
        type: fuelType,
        charge_per_unit: Number(fuelChargePerUnit) || 0,
      };

      const lateReturnRules = {
        grace_period_hours: Number(gracePeriodHours) || 0,
        hourly_charge: Number(hourlyCharge) || 0,
        daily_cap: Number(dailyCap) || 0,
      };

      const rawPayload: Record<string, unknown> = {
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
      const cleaned = cleanPayload(rawPayload) as Record<string, unknown>;
      const payload = cleaned as unknown as CreateRatePlanPayload;

      await ratePlanService.createRatePlan(payload);
      toast.success('Rate plan created');
      router.push('/rate-plans');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to create rate plan';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/rate-plans')} className="text-gray-500 hover:text-gray-700">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title="Create Rate Plan" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Economy Daily Plan"
            required
          />
        </div>

        {/* Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (AED)</label>
            <input
              type="number"
              step="0.01"
              value={form.daily_rate}
              onChange={(e) => handleChange('daily_rate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
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
              placeholder="0.00"
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
              placeholder="0.00"
            />
          </div>
        </div>

        {/* KM and Deposit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Included KM/Day</label>
            <input
              type="number"
              value={form.included_km_per_day}
              onChange={(e) => handleChange('included_km_per_day', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 250"
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
              placeholder="0.00"
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
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Fuel Policy */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Fuel Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Policy Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full_to_full">Full to Full</option>
                <option value="half_to_full">Half to Full</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Charge per Unit (AED)</label>
              <input
                type="number"
                step="0.01"
                value={fuelChargePerUnit}
                onChange={(e) => setFuelChargePerUnit(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Late Return Rules */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Late Return Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Grace Period (Hours)</label>
              <input
                type="number"
                value={gracePeriodHours}
                onChange={(e) => setGracePeriodHours(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hourly Charge (AED)</label>
              <input
                type="number"
                step="0.01"
                value={hourlyCharge}
                onChange={(e) => setHourlyCharge(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Daily Cap (AED)</label>
              <input
                type="number"
                step="0.01"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="150"
              />
            </div>
          </div>
        </div>

        {/* Terms Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
          <textarea
            value={form.terms_text}
            onChange={(e) => handleChange('terms_text', e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter terms and conditions..."
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
            <p className="text-sm text-gray-500">No add-ons added yet.</p>
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

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/rate-plans')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Rate Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
