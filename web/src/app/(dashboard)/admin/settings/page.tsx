'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineCog6Tooth,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlinePhone,
} from 'react-icons/hi2';
import { adminSettingsService } from '@/services/admin-settings.service';
import apiClient from '@/lib/api-client';
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
  const [company, setCompany]   = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'charges'>('company');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, profileRes] = await Promise.allSettled([
        adminSettingsService.getAdminSettings(),
        apiClient.get('/v1/company-profile'),
      ]);
      if (settingsRes.status === 'fulfilled') {
        const data = settingsRes.value?.data ?? settingsRes.value;
        setSettings(data ?? {});
      }
      if (profileRes.status === 'fulfilled') {
        const d = profileRes.value.data?.data ?? profileRes.value.data;
        setCompany(d?.company || {});
      }
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
      if (activeTab === 'company') {
        await apiClient.patch('/v1/company-profile/company', company);
        toast.success('Company profile saved');
      } else {
        const numericKeys: (keyof Settings)[] = [
          'extra_km_rate', 'fuel_rate', 'late_fee_per_day', 'late_return_grace_minutes',
          'vat_rate', 'discount_threshold_percent', 'damage_charge_auto_approve_below',
          'reminder_days_before_expiry',
        ];
        const payload: Record<string, any> = { ...settings };
        numericKeys.forEach((k) => {
          if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]);
        });
        await adminSettingsService.updateAdminSettings(payload);
        toast.success('Settings saved');
      }
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

  const cInput = (key: string, opts: { placeholder?: string; dir?: 'rtl' } = {}) => (
    <input
      type="text"
      value={company[key] ?? ''}
      onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
      dir={opts.dir}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder={opts.placeholder}
    />
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <HiOutlineCog6Tooth className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Company profile, contract terms &amp; charge rules</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 shadow-sm">
          {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? 'Saving...' : activeTab === 'company' ? 'Save Company Profile' : 'Save Charge Rules'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([['company','Company Profile',<HiOutlineBuildingOffice2 className="h-4 w-4" />],['charges','Charge Rules',<HiOutlineCurrencyDollar className="h-4 w-4" />]] as any[]).map(([key,label,icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab===key?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Company Profile */}
      {activeTab === 'company' && (
        <>
          <p className="text-xs text-gray-500 -mt-2">This information appears on the printed rental contract and invoices.</p>

          <Section title="Company Identity" icon={<HiOutlineBuildingOffice2 className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Company Name (English)">{cInput('name', { placeholder: 'Secrets World Cars Rental' })}</Field>
              <Field label="Company Name (Arabic)">{cInput('name_ar', { dir: 'rtl' })}</Field>
              <Field label="Trade License No.">{cInput('trade_license_number')}</Field>
              <Field label="TRN / VAT Number" hint="UAE Tax Registration Number">{cInput('trn_number')}</Field>
            </div>
            <div className="mt-5">
              <Field label="Logo URL" hint="Shown on the contract header. Paste a public image URL.">{cInput('logo_url', { placeholder: 'https://...' })}</Field>
            </div>
          </Section>

          <Section title="Contact & Address" icon={<HiOutlinePhone className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Phone">{cInput('phone_number', { placeholder: '+971 …' })}</Field>
              <Field label="Website">{cInput('website', { placeholder: 'www.example.com' })}</Field>
              <Field label="City">{cInput('city')}</Field>
              <Field label="Country">{cInput('country', { placeholder: 'UAE' })}</Field>
            </div>
            <div className="mt-5">
              <Field label="Address"><textarea value={company.address??''} onChange={e=>setCompany({...company,address:e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></Field>
            </div>
          </Section>

          <Section title="Invoicing & Tax" icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Invoice Prefix" hint="e.g. INV, RNT">{cInput('invoice_prefix', { placeholder: 'INV' })}</Field>
              <Field label="Currency">{cInput('currency', { placeholder: 'AED' })}</Field>
              <Field label="VAT Rate (%)" hint="UAE standard is 5%">
                <input type="number" value={company.vat_rate??''} onChange={e=>setCompany({...company,vat_rate:e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="5" />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Invoice Footer" hint="Appears at the bottom of every invoice"><textarea value={company.invoice_footer??''} onChange={e=>setCompany({...company,invoice_footer:e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Thank you for your business. All amounts in AED." /></Field>
            </div>
          </Section>

          <Section title="Contract Terms & Conditions" icon={<HiOutlineDocumentText className="h-5 w-5" />}>
            <Field label="Agreement Terms" hint="Shown on the rental contract. Each line becomes a numbered clause. Leave empty to use the built-in default terms.">
              <textarea value={company.agreement_terms??''} onChange={e=>setCompany({...company,agreement_terms:e.target.value})} rows={10} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={"One clause per line, e.g.\nInsurance excess of AED 2,000 applies per at-fault accident.\nReturn the vehicle with the same fuel level as at pickup.\nSmoking is prohibited; a cleaning fee of AED 250 applies."} />
            </Field>
          </Section>
        </>
      )}

      {/* Charge Rules (original) */}
      {activeTab === 'charges' && <>
      <p className="text-xs text-gray-500 -mt-2">Default rates and rules applied when generating charges and invoices.</p>
      <Section title="Rental Charges" icon={<HiOutlineCurrencyDollar className="h-5 w-5" />}>
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
      </>}
    </div>
  );
}
