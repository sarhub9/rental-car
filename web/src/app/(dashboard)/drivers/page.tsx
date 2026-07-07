'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { driverService, DriverProfile } from '@/services/driver.service';
import { StatusBadge } from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import { extractApiError } from '@/lib/api-error';
import {
  HiPlus, HiMagnifyingGlass, HiPencilSquare, HiXMark,
  HiShieldExclamation, HiShieldCheck, HiIdentification,
  HiExclamationTriangle, HiChevronRight,
} from 'react-icons/hi2';

const DRIVER_TYPES = [
  { value: 'MAIN_CUSTOMER', label: 'Main Customer', color: 'bg-blue-100 text-blue-700' },
  { value: 'ADDITIONAL', label: 'Additional', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'COMPANY', label: 'Company', color: 'bg-orange-100 text-orange-700' },
  { value: 'CORPORATE', label: 'Corporate', color: 'bg-purple-100 text-purple-700' },
  { value: 'STAFF_DELIVERY', label: 'Staff Delivery', color: 'bg-green-100 text-green-700' },
  { value: 'STAFF_COLLECTION', label: 'Staff Collection', color: 'bg-teal-100 text-teal-700' },
];

const LICENSE_COUNTRIES = ['UAE', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman', 'Qatar', 'UK', 'USA', 'India', 'Pakistan', 'Philippines', 'Other'];

const TABS = ['Basic Info', 'License', 'ID Documents'] as const;
type Tab = typeof TABS[number];

const emptyForm = {
  driver_type: 'MAIN_CUSTOMER',
  full_name: '', phone_number: '', whatsapp_number: '', email: '',
  nationality: '', date_of_birth: '', address: '',
  emirates_id: '', emirates_id_expiry: '',
  passport_number: '', passport_expiry: '',
  visa_number: '', visa_expiry: '',
  driving_license_number: '', license_expiry_date: '',
  license_country: 'UAE', idp_required: false, idp_number: '', idp_expiry: '',
  customer_id: '',
};

function isExpired(d?: string) { return !!d && new Date(d) < new Date(); }

function Field({ label, name, value, onChange, disabled, type = 'text', required = false, dir }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled}
        required={required} dir={dir}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 bg-white transition-colors" />
    </div>
  );
}

function DateField({ label, name, value, onChange, disabled, required = false }: any) {
  const exp = isExpired(value);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="date" name={name} value={value} onChange={onChange} disabled={disabled} required={required}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${exp && value ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`} />
      {exp && value && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <HiExclamationTriangle className="w-3.5 h-3.5" /> Expired
        </p>
      )}
    </div>
  );
}

function SelectField({ label, name, value, onChange, disabled, options, required = false }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select name={name} value={value} onChange={onChange} disabled={disabled} required={required}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 bg-white transition-colors appearance-none">
        {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

// ── Drawer ──────────────────────────────────────────────────────────────────
function DriverDrawer({ open, onClose, driver, onSaved }: {
  open: boolean; onClose: () => void;
  driver: DriverProfile | null; onSaved: () => void;
}) {
  const isEdit = !!driver;
  const [readOnly, setReadOnly] = useState(isEdit);
  const [tab, setTab] = useState<Tab>('Basic Info');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setTab('Basic Info');
      setReadOnly(isEdit);
      if (driver) {
        setForm({
          driver_type: driver.driver_type,
          full_name: driver.full_name,
          phone_number: driver.phone_number,
          whatsapp_number: driver.whatsapp_number || '',
          email: driver.email || '',
          nationality: driver.nationality || '',
          date_of_birth: driver.date_of_birth?.substring(0, 10) || '',
          address: driver.address || '',
          emirates_id: driver.emirates_id || '',
          emirates_id_expiry: driver.emirates_id_expiry?.substring(0, 10) || '',
          passport_number: driver.passport_number || '',
          passport_expiry: driver.passport_expiry?.substring(0, 10) || '',
          visa_number: driver.visa_number || '',
          visa_expiry: driver.visa_expiry?.substring(0, 10) || '',
          driving_license_number: driver.driving_license_number,
          license_expiry_date: driver.license_expiry_date?.substring(0, 10) || '',
          license_country: driver.license_country || 'UAE',
          idp_required: driver.idp_required || false,
          idp_number: driver.idp_number || '',
          idp_expiry: driver.idp_expiry?.substring(0, 10) || '',
          customer_id: driver.customer_id || '',
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, driver, isEdit]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone_number || !form.driving_license_number || !form.license_expiry_date) {
      toast.error('Full name, phone, license number and expiry are required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      if (isEdit && driver) {
        await driverService.updateDriver(driver.id, payload);
        toast.success('Driver updated');
      } else {
        await driverService.createDriver(payload);
        toast.success('Driver created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save driver'));
    } finally {
      setSaving(false);
    }
  };

  const handleBlacklist = async () => {
    if (!driver || !reason.trim()) return;
    try {
      await driverService.blacklistDriver(driver.id, reason);
      toast.success('Driver blacklisted');
      setShowBlacklist(false);
      onSaved(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed')); }
  };

  const handleUnblacklist = async () => {
    if (!driver) return;
    try {
      await driverService.unblacklistDriver(driver.id);
      toast.success('Removed from blacklist');
      onSaved(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed')); }
  };

  const typeInfo = DRIVER_TYPES.find(t => t.value === form.driver_type);
  const ro = readOnly;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Driver Profile' : 'Add New Driver'}</h2>
            {isEdit && driver && (
              <p className="text-xs text-gray-500 mt-0.5">{driver.driver_number}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Blacklist banner */}
        {isEdit && driver?.is_blacklisted && (
          <div className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiShieldExclamation className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">Blacklisted</p>
                {driver.blacklist_reason && <p className="text-xs text-red-500">{driver.blacklist_reason}</p>}
              </div>
            </div>
            <button onClick={handleUnblacklist}
              className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200">
              Remove
            </button>
          </div>
        )}

        {/* Driver Type selector */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Driver Type</p>
          <div className="flex flex-wrap gap-2">
            {DRIVER_TYPES.map(t => (
              <button key={t.value} type="button" disabled={ro}
                onClick={() => setForm(p => ({ ...p, driver_type: t.value }))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  form.driver_type === t.value
                    ? `${t.color} border-current shadow-sm`
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                } disabled:cursor-default`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {tab === 'Basic Info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Full Name" name="full_name" value={form.full_name} onChange={handleInput} disabled={ro} required />
                </div>
                <Field label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleInput} disabled={ro} required />
                <Field label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} onChange={handleInput} disabled={ro} />
                <Field label="Email" name="email" value={form.email} onChange={handleInput} disabled={ro} type="email" />
                <Field label="Nationality" name="nationality" value={form.nationality} onChange={handleInput} disabled={ro} />
                <DateField label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={handleInput} disabled={ro} />
                <div className="col-span-2">
                  <Field label="Address" name="address" value={form.address} onChange={handleInput} disabled={ro} />
                </div>
              </div>
            </div>
          )}

          {tab === 'License' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={handleInput} disabled={ro} required />
                </div>
                <DateField label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={handleInput} disabled={ro} required />
                <SelectField label="License Country" name="license_country" value={form.license_country} onChange={handleInput} disabled={ro}
                  options={LICENSE_COUNTRIES.map(c => ({ value: c, label: c }))} />
              </div>

              {/* IDP */}
              <div className="mt-2 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="idp_required" name="idp_required"
                    checked={form.idp_required} onChange={handleInput} disabled={ro}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                  <label htmlFor="idp_required" className="text-sm font-medium text-gray-700">
                    International Driving Permit (IDP) Required
                  </label>
                </div>
                {form.idp_required && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <Field label="IDP Number" name="idp_number" value={form.idp_number} onChange={handleInput} disabled={ro} />
                    <DateField label="IDP Expiry" name="idp_expiry" value={form.idp_expiry} onChange={handleInput} disabled={ro} />
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'ID Documents' && (
            <div className="space-y-5">
              {/* Emirates ID */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Emirates ID</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={handleInput} disabled={ro} />
                  </div>
                  <DateField label="Emirates ID Expiry" name="emirates_id_expiry" value={form.emirates_id_expiry} onChange={handleInput} disabled={ro} />
                </div>
              </div>

              {/* Passport */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Passport</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Passport Number" name="passport_number" value={form.passport_number} onChange={handleInput} disabled={ro} />
                  <DateField label="Passport Expiry" name="passport_expiry" value={form.passport_expiry} onChange={handleInput} disabled={ro} />
                </div>
              </div>

              {/* Visa */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Visa</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Visa Number" name="visa_number" value={form.visa_number} onChange={handleInput} disabled={ro} />
                  <DateField label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={handleInput} disabled={ro} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isEdit && ro ? (
            <div className="flex gap-2">
              {!driver?.is_blacklisted ? (
                <button onClick={() => setShowBlacklist(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
                  <HiShieldExclamation className="w-4 h-4" /> Blacklist
                </button>
              ) : null}
              <button onClick={() => setReadOnly(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                <HiPencilSquare className="w-4 h-4" /> Edit Driver
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {isEdit && (
                <button onClick={() => setReadOnly(true)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Driver'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Blacklist confirmation */}
      {showBlacklist && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlacklist(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <HiShieldExclamation className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Blacklist Driver</h3>
                <p className="text-sm text-gray-500">This will block the driver from rentals</p>
              </div>
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Reason for blacklisting..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowBlacklist(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleBlacklist} disabled={!reason.trim()}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<DriverProfile | null>(null);

  useEffect(() => { router.prefetch('/drivers/create'); }, [router]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch.trim()) {
        const res = await driverService.searchDrivers(debouncedSearch);
        const items = Array.isArray(res) ? res : [];
        setDrivers(items);
        setTotalCount(items.length);
        setTotalPages(1);
      } else {
        const res = await driverService.listDrivers({
          page, limit: 15,
          ...(typeFilter ? { driver_type: typeFilter } : {}),
        });
        const items = res?.data ?? res ?? [];
        setDrivers(Array.isArray(items) ? items : []);
        setTotalCount(res?.total ?? items.length ?? 0);
        setTotalPages(res?.pages ?? 1);
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const openAdd = () => router.push('/drivers/create');
  const openEdit = (d: DriverProfile) => { setSelected(d); setDrawerOpen(true); };

  const handleUnblacklist = async (e: React.MouseEvent, d: DriverProfile) => {
    e.stopPropagation();
    try {
      await driverService.unblacklistDriver(d.id);
      toast.success('Removed from blacklist');
      fetchDrivers();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed')); }
  };

  const typeInfo = (val: string) => DRIVER_TYPES.find(t => t.value === val);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Profiles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount > 0 ? `${totalCount} driver${totalCount !== 1 ? 's' : ''}` : 'Manage all driver profiles'}
          </p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          <HiPlus className="w-5 h-5" /> Add Driver
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search drivers..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[160px]">
          <option value="">All Types</option>
          {DRIVER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiIdentification className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No drivers found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first driver to get started</p>
            <button onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Add Driver
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">License</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d, i) => {
                const ti = typeInfo(d.driver_type);
                const licExpired = isExpired(d.license_expiry_date);
                return (
                  <tr key={d.id} onClick={() => openEdit(d)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-sm text-gray-400">{(page - 1) * 15 + i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {d.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{d.full_name}</p>
                          <p className="text-xs text-gray-400">{d.phone_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${ti?.color || 'bg-gray-100 text-gray-600'}`}>
                        {ti?.label || d.driver_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 font-mono">{d.driving_license_number}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${licExpired ? 'text-red-600' : 'text-gray-700'}`}>
                        {d.license_expiry_date ? new Date(d.license_expiry_date).toLocaleDateString('en-GB') : '—'}
                        {licExpired && <span className="ml-1 text-xs text-red-500">(Expired)</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${d.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {d.is_blacklisted && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Blacklisted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} · {totalCount} drivers</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 bg-white">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 bg-white">Next</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      <DriverDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        driver={selected}
        onSaved={fetchDrivers}
      />
    </div>
  );
}
