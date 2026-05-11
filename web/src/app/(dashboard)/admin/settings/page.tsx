'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineCog6Tooth,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { adminSettingsService } from '@/services/admin-settings.service';
import { PageHeader } from '@/components/PageHeader';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

interface Settings {
  // Charge Rules
  extra_km_rate?: number | string;
  fuel_rate?: number | string;
  late_fee_per_day?: number | string;
  late_return_grace_minutes?: number | string;
  // VAT
  vat_rate?: number | string;
  vat_enabled?: boolean;
  // Thresholds
  discount_threshold_percent?: number | string;
  damage_charge_auto_approve_below?: number | string;
  // Documents
  reminder_days_before_expiry?: number | string;
  block_checkout_on_expired_docs?: boolean;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
        <span className="text-blue-500">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminSettingsService.getAdminSettings();
      const data = res?.data ?? res;
      setSettings(data ?? {});
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Convert numeric strings to numbers
      const numericKeys: (keyof Settings)[] = [
        'extra_km_rate', 'fuel_rate', 'late_fee_per_day', 'late_return_grace_minutes',
        'vat_rate', 'discount_threshold_percent', 'damage_charge_auto_approve_below',
        'reminder_days_before_expiry',
      ];
      const payload: Record<string, any> = { ...settings };
      numericKeys.forEach((k) => {
        if (payload[k] !== undefined && payload[k] !== '') {
          payload[k] = Number(payload[k]);
        }
      });
      await adminSettingsService.updateAdminSettings(payload);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const numInput = (key: keyof Settings, placeholder?: string) => (
    <input
      type="number"
      value={settings[key] as string ?? ''}
      onChange={(e) => set(key, e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder={placeholder}
    />
  );

  const toggle = (key: keyof Settings) => (
    <button
      type="button"
      onClick={() => set(key, !settings[key])}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        settings[key] ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          settings[key] ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <HiOutlineCog6Tooth className="h-5 w-5 text-gray-600" />
          </div>
          <PageHeader title="Admin Settings" />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Charge Rules */}
      <Section title="Charge Rules" icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Extra KM Rate (AED/km)" hint="Charged per km over the allowed limit">
            {numInput('extra_km_rate', '0.00')}
          </Field>
          <Field label="Fuel Rate (AED/liter)" hint="Fuel top-up charge per liter">
            {numInput('fuel_rate', '0.00')}
          </Field>
          <Field label="Late Fee Per Day (AED)" hint="Charged per day for late return">
            {numInput('late_fee_per_day', '0.00')}
          </Field>
          <Field label="Late Return Grace (minutes)" hint="Minutes allowed before late fee applies">
            {numInput('late_return_grace_minutes', '30')}
          </Field>
        </div>
      </Section>

      {/* VAT Settings */}
      <Section title="VAT Settings" icon={<HiOutlineShieldCheck className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="VAT Rate (%)" hint="UAE standard VAT is 5%">
            {numInput('vat_rate', '5')}
          </Field>
          <Field label="VAT Enabled">
            <div className="flex items-center gap-3 pt-1">
              {toggle('vat_enabled')}
              <span className="text-sm text-gray-600">{settings.vat_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </Field>
        </div>
      </Section>

      {/* Thresholds */}
      <Section title="Business Thresholds" icon={<HiOutlineCog6Tooth className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Max Discount (%)" hint="Maximum discount staff can apply to an agreement">
            {numInput('discount_threshold_percent', '20')}
          </Field>
          <Field label="Auto-Approve Damage Charge Below (AED)" hint="Damage charges below this amount are auto-approved">
            {numInput('damage_charge_auto_approve_below', '500')}
          </Field>
        </div>
      </Section>

      {/* Document Rules */}
      <Section title="Document Rules" icon={<HiOutlineDocumentText className="h-5 w-5" />}>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Expiry Reminder (days before)" hint="Days before expiry to start showing reminders">
            {numInput('reminder_days_before_expiry', '30')}
          </Field>
          <Field label="Block Checkout on Expired Docs">
            <div className="flex items-center gap-3 pt-1">
              {toggle('block_checkout_on_expired_docs')}
              <span className="text-sm text-gray-600">
                {settings.block_checkout_on_expired_docs ? 'Blocked' : 'Allowed'}
              </span>
            </div>
          </Field>
        </div>
      </Section>
    </div>
  );
}
