'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
  HiOutlineCog6Tooth, HiOutlinePaintBrush, HiOutlineCheckCircle,
  HiOutlineXCircle, HiOutlineShieldCheck, HiOutlineGlobeAlt,
  HiOutlineBellAlert, HiOutlineDevicePhoneMobile, HiOutlineTruck,
  HiOutlineUserGroup, HiOutlineBuildingOffice2, HiOutlineCurrencyDollar,
} from 'react-icons/hi2';

// ── Feature Flag definitions ─────────────────────────────────────────────────
const FLAG_GROUPS = [
  {
    group: 'Core Modules',
    icon: HiOutlineCog6Tooth,
    flags: [
      { key: 'driver_module',        label: 'Driver Module',        icon: HiOutlineUserGroup,       desc: 'Separate driver profiles — customer, company, corporate & staff drivers' },
      { key: 'corporate_billing',    label: 'Corporate Billing',    icon: HiOutlineBuildingOffice2, desc: 'Monthly invoicing and credit limits for corporate accounts' },
      { key: 'multi_branch',         label: 'Multi-Branch',         icon: HiOutlineBuildingOffice2, desc: 'Multiple branches with separate vehicle and staff assignment' },
      { key: 'customer_portal',      label: 'Customer Portal',      icon: HiOutlineGlobeAlt,        desc: 'Self-service portal for customers — rentals, invoices, disputes' },
    ],
  },
  {
    group: 'Fleet & Operations',
    icon: HiOutlineTruck,
    flags: [
      { key: 'toll_auto_attribution', label: 'Toll Auto-Attribution', icon: HiOutlineCurrencyDollar, desc: 'Auto-attribute Salik/toll charges to rentals by plate number & date' },
      { key: 'mobile_app',            label: 'Mobile App',            icon: HiOutlineDevicePhoneMobile, desc: 'Mobile app access for drivers and customers (React Native)' },
    ],
  },
  {
    group: 'Notifications',
    icon: HiOutlineBellAlert,
    flags: [
      { key: 'whatsapp_notifications', label: 'WhatsApp Notifications', icon: HiOutlineBellAlert,          desc: 'Send booking confirmations and alerts via WhatsApp Business API' },
      { key: 'sms_otp',               label: 'SMS OTP Login',           icon: HiOutlineDevicePhoneMobile,  desc: 'Customer login via OTP sent to their registered phone number' },
    ],
  },
];

const DEFAULT_FLAGS: Record<string, boolean> = {
  driver_module: true, corporate_billing: true, multi_branch: true,
  toll_auto_attribution: true, whatsapp_notifications: false,
  sms_otp: true, mobile_app: true, customer_portal: true,
};

const DEFAULT_THEME = {
  company_name: 'Drivebx ERP',
  primary_color: '#0E7490',
  sidebar_color: '#0F172A',
};

const LS_KEY = 'superadmin_settings_local';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [flags, setFlags]         = useState<Record<string, boolean>>(DEFAULT_FLAGS);
  const [theme, setTheme]         = useState(DEFAULT_THEME);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [savedOnline, setSavedOnline] = useState<boolean | null>(null);
  const [tab, setTab]             = useState<'features' | 'theme'>('features');

  const applyTheme = (t: typeof DEFAULT_THEME) => {
    document.documentElement.style.setProperty('--sa-primary', t.primary_color);
    document.documentElement.style.setProperty('--sa-sidebar', t.sidebar_color);
  };

  // Load settings — try API first, fall back to localStorage
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/v1/admin/superadmin-settings');
        const data = res.data?.settings || {};
        if (data.feature_flags) setFlags(data.feature_flags);
        if (data.theme) {
          const t = { ...DEFAULT_THEME, ...data.theme };
          setTheme(t); applyTheme(t);
        }
        setSavedOnline(true);
      } catch {
        // Load from localStorage fallback
        const local = loadLocal();
        if (local.feature_flags) setFlags(local.feature_flags);
        if (local.theme) {
          const t = { ...DEFAULT_THEME, ...local.theme };
          setTheme(t); applyTheme(t);
        }
        setSavedOnline(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = { feature_flags: flags, theme };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    applyTheme(theme);
    try {
      await apiClient.put('/v1/admin/superadmin-settings', payload);
      setSavedOnline(true);
      toast.success('Settings saved & applied');
    } catch {
      setSavedOnline(false);
      toast.success('Theme applied — saved locally');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount   = Object.keys(DEFAULT_FLAGS).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#0E7490] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control feature availability and platform appearance</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {savedOnline !== null && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${savedOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${savedOnline ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
              {savedOnline ? 'Synced to server' : 'Saved locally'}
            </span>
          )}
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E7490] hover:bg-[#0C6680] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <HiOutlineShieldCheck className="w-4 h-4" />
            }
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('features')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'features' ? 'bg-[#0E7490] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <HiOutlineCog6Tooth className="w-4 h-4" /> Feature Flags
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === 'features' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {enabledCount}/{totalCount}
          </span>
        </button>
        <button onClick={() => setTab('theme')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'theme' ? 'bg-[#0E7490] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          <HiOutlinePaintBrush className="w-4 h-4" /> Appearance
        </button>
      </div>

      {/* ── Feature Flags Tab ── */}
      {tab === 'features' && (
        <div className="space-y-5">
          {FLAG_GROUPS.map(group => {
            const GroupIcon = group.icon;
            return (
              <div key={group.group} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Group header */}
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                  <GroupIcon className="w-4 h-4 text-[#0E7490]" />
                  <h2 className="text-sm font-bold text-gray-700">{group.group}</h2>
                  <span className="ml-auto text-xs text-gray-400">
                    {group.flags.filter(f => flags[f.key]).length}/{group.flags.length} enabled
                  </span>
                </div>

                {/* Flags */}
                <div className="divide-y divide-gray-100">
                  {group.flags.map(flag => {
                    const FlagIcon = flag.icon;
                    const enabled  = flags[flag.key] ?? false;
                    return (
                      <div key={flag.key}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-[#0E7490]/10' : 'bg-gray-100'}`}>
                          <FlagIcon className={`w-4.5 h-4.5 ${enabled ? 'text-[#0E7490]' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>{flag.label}</p>
                            {enabled
                              ? <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              : <HiOutlineXCircle className="w-3.5 h-3.5 text-gray-300" />
                            }
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{flag.desc}</p>
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={() => setFlags(prev => ({ ...prev, [flag.key]: !prev[flag.key] }))}
                          className={`relative flex-shrink-0 inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30 ${enabled ? 'bg-[#0E7490]' : 'bg-gray-200'}`}>
                          <span className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Appearance Tab ── */}
      {tab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Settings form */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              <h2 className="text-sm font-bold text-gray-900">Brand & Colors</h2>

              {/* Company name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Platform Name</label>
                <input type="text" value={theme.company_name}
                  onChange={e => setTheme(p => ({ ...p, company_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490] focus:border-[#0E7490] outline-none" />
              </div>

              {/* Primary color */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Accent Color</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-200"
                      style={{ backgroundColor: theme.primary_color }} />
                    <input type="color" value={theme.primary_color}
                      onChange={e => setTheme(p => ({ ...p, primary_color: e.target.value }))}
                      className="sr-only" />
                  </label>
                  <input type="text" value={theme.primary_color}
                    onChange={e => setTheme(p => ({ ...p, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0E7490] focus:border-[#0E7490] outline-none" />
                </div>
                {/* Quick presets */}
                <div className="flex gap-2 mt-2">
                  {['#0E7490','#2563EB','#7C3AED','#059669','#DC2626','#D97706'].map(c => (
                    <button key={c} onClick={() => setTheme(p => ({ ...p, primary_color: c }))}
                      title={c}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${theme.primary_color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Sidebar color */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sidebar Color</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-200"
                      style={{ backgroundColor: theme.sidebar_color }} />
                    <input type="color" value={theme.sidebar_color}
                      onChange={e => setTheme(p => ({ ...p, sidebar_color: e.target.value }))}
                      className="sr-only" />
                  </label>
                  <input type="text" value={theme.sidebar_color}
                    onChange={e => setTheme(p => ({ ...p, sidebar_color: e.target.value }))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#0E7490] focus:border-[#0E7490] outline-none" />
                </div>
                <div className="flex gap-2 mt-2">
                  {['#0F172A','#1E1B4B','#1C1917','#064E3B','#1E3A5F','#374151'].map(c => (
                    <button key={c} onClick={() => setTheme(p => ({ ...p, sidebar_color: c }))}
                      title={c}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${theme.sidebar_color === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Live Preview</h2>
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 flex" style={{ height: '340px' }}>
              {/* Sidebar preview */}
              <div className="w-44 flex flex-col flex-shrink-0" style={{ backgroundColor: theme.sidebar_color }}>
                <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primary_color }}>
                    <HiOutlineTruck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white truncate">{theme.company_name || 'Drivebx ERP'}</span>
                </div>
                <nav className="flex-1 p-2 space-y-0.5">
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Agreements', active: false },
                    { label: 'Customers', active: false },
                    { label: 'Vehicles', active: false },
                    { label: 'Invoices', active: false },
                  ].map(item => (
                    <div key={item.label}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: item.active ? theme.primary_color : 'transparent',
                        color: item.active ? 'white' : 'rgba(203,213,225,0.8)',
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.active ? 'white' : 'rgba(203,213,225,0.4)' }} />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Main area preview */}
              <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-24 bg-gray-200 rounded-md" />
                  <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: theme.primary_color }} />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-gray-200">
                      <div className="h-3 w-10 bg-gray-200 rounded mb-1" />
                      <div className="h-5 w-14 rounded" style={{ backgroundColor: `${theme.primary_color}20` }} />
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: `${theme.primary_color}20` }} />
                      <div className="h-2.5 flex-1 bg-gray-100 rounded" />
                      <div className="h-2.5 w-10 rounded" style={{ backgroundColor: `${theme.primary_color}30` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
