'use client';

import { useState, useEffect, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import toast from 'react-hot-toast';
import { cleanPayload } from '@/lib/clean-payload';
import {
  HiPlus, HiMagnifyingGlass, HiPencilSquare, HiXMark,
  HiExclamationTriangle, HiShieldExclamation, HiChevronRight,
  HiUser, HiGlobeAlt, HiOutlineBuildingOffice2, HiBuildingOffice2,
} from 'react-icons/hi2';

// ── Constants ────────────────────────────────────────────────────────────────
const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const CUSTOMER_TYPES = [
  { value: 'UAE_RESIDENT', label: 'UAE Resident', desc: 'Individual living in UAE', icon: HiUser, color: 'border-blue-200 bg-blue-50 text-blue-700', accent: 'bg-blue-600' },
  { value: 'TOURIST', label: 'Tourist', desc: 'Visiting from abroad', icon: HiGlobeAlt, color: 'border-green-200 bg-green-50 text-green-700', accent: 'bg-green-600' },
  { value: 'COMPANY', label: 'Company', desc: 'Business account', icon: HiOutlineBuildingOffice2, color: 'border-orange-200 bg-orange-50 text-orange-700', accent: 'bg-orange-600' },
  { value: 'CORPORATE', label: 'Corporate', desc: 'Large account with credit', icon: HiBuildingOffice2, color: 'border-purple-200 bg-purple-50 text-purple-700', accent: 'bg-purple-600' },
] as const;

type CustomerType = 'UAE_RESIDENT' | 'TOURIST' | 'COMPANY' | 'CORPORATE';

const TYPE_BADGE: Record<string, string> = {
  UAE_RESIDENT: 'bg-blue-100 text-blue-700',
  TOURIST: 'bg-green-100 text-green-700',
  COMPANY: 'bg-orange-100 text-orange-700',
  CORPORATE: 'bg-purple-100 text-purple-700',
  INDIVIDUAL: 'bg-gray-100 text-gray-600',
};

const emptyForm = {
  customer_type: 'UAE_RESIDENT' as CustomerType,
  full_name_en: '', full_name_ar: '',
  phone_number: '', whatsapp_number: '', email: '',
  nationality: '', date_of_birth: '',
  emirates_id: '', id_expiry_date: '',
  driving_license_number: '', license_expiry_date: '',
  passport_number: '', passport_expiry: '',
  visa_number: '', visa_expiry: '',
  hotel_name: '', hotel_address: '', arrival_date: '', departure_date: '',
  address_line_1: '', address_line_2: '', city: '', emirate: '',
  company_name: '', trade_license_number: '', trade_license_expiry: '',
  trn_number: '', authorized_person_name: '', authorized_person_mobile: '',
  payment_terms: 'CASH', credit_limit: '',
};

// ── Field Helpers ────────────────────────────────────────────────────────────
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
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 ${exp && value ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`} />
      {exp && value && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <HiExclamationTriangle className="w-3.5 h-3.5" /> Expired
        </p>
      )}
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────
function CustomerDrawer({ open, onClose, customer, onSaved }: {
  open: boolean; onClose: () => void; customer: any | null; onSaved: () => void;
}) {
  const isEdit = !!customer;
  const [readOnly, setReadOnly] = useState(isEdit);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReadOnly(isEdit);
      if (customer) {
        setForm({
          customer_type: (customer.customer_type as CustomerType) || 'UAE_RESIDENT',
          full_name_en: customer.full_name_en || '',
          full_name_ar: customer.full_name_ar || '',
          phone_number: customer.phone_number || '',
          whatsapp_number: customer.whatsapp_number || '',
          email: customer.email || '',
          nationality: customer.nationality || '',
          date_of_birth: customer.date_of_birth?.substring(0, 10) || '',
          emirates_id: customer.emirates_id || '',
          id_expiry_date: customer.id_expiry_date?.substring(0, 10) || '',
          driving_license_number: customer.driving_license_number || '',
          license_expiry_date: customer.license_expiry_date?.substring(0, 10) || '',
          passport_number: customer.passport_number || '',
          passport_expiry: customer.passport_expiry?.substring(0, 10) || '',
          visa_number: customer.visa_number || '',
          visa_expiry: customer.visa_expiry?.substring(0, 10) || '',
          hotel_name: customer.hotel_name || '',
          hotel_address: customer.hotel_address || '',
          arrival_date: customer.arrival_date?.substring(0, 10) || '',
          departure_date: customer.departure_date?.substring(0, 10) || '',
          address_line_1: customer.address_line_1 || '',
          address_line_2: customer.address_line_2 || '',
          city: customer.city || '',
          emirate: customer.emirate || '',
          company_name: customer.company_name || '',
          trade_license_number: customer.trade_license_number || '',
          trade_license_expiry: customer.trade_license_expiry?.substring(0, 10) || '',
          trn_number: customer.trn_number || '',
          authorized_person_name: customer.authorized_person_name || '',
          authorized_person_mobile: customer.authorized_person_mobile || '',
          payment_terms: customer.payment_terms || 'CASH',
          credit_limit: customer.credit_limit || '',
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, customer, isEdit]);

  const hi = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const setType = (t: CustomerType) => {
    if (!readOnly) setForm(p => ({ ...p, customer_type: t }));
  };

  const handleSave = async () => {
    if (!form.full_name_en || !form.phone_number) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const payload = cleanPayload(form) as Record<string, unknown>;
      if (isEdit && customer) {
        await customerService.updateCustomer(customer.id, payload as any);
        toast.success('Customer updated');
      } else {
        await customerService.createCustomer(payload as any);
        toast.success('Customer created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // doc warnings
  const warnings: string[] = [];
  if (isExpired(form.license_expiry_date)) warnings.push('Driving license expired');
  if (isExpired(form.id_expiry_date)) warnings.push('Emirates ID expired');
  if (isExpired(form.passport_expiry)) warnings.push('Passport expired');
  if (isExpired(form.visa_expiry)) warnings.push('Visa expired');
  if (isExpired(form.trade_license_expiry)) warnings.push('Trade license expired');

  const currentType = CUSTOMER_TYPES.find(t => t.value === form.customer_type);
  const ro = readOnly;

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            {currentType && (
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentType.accent}`}>
                <currentType.icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Customer Details' : 'Add Customer'}</h2>
              {isEdit && customer && <p className="text-xs text-gray-500">{customer.customer_number}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mx-4 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5 mb-1">
              <HiExclamationTriangle className="w-4 h-4" /> {warnings.length} Document Issue{warnings.length > 1 ? 's' : ''}
            </p>
            <ul className="text-xs text-amber-600 space-y-0.5">
              {warnings.map(w => <li key={w} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />{w}</li>)}
            </ul>
          </div>
        )}

        {/* Blacklisted */}
        {isEdit && customer?.is_blacklisted && (
          <div className="mx-4 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <HiShieldExclamation className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Blacklisted</p>
              {customer.blacklist_reason && <p className="text-xs text-red-500">{customer.blacklist_reason}</p>}
            </div>
          </div>
        )}

        {/* Type selector */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Customer Type</p>
          <div className="grid grid-cols-4 gap-2">
            {CUSTOMER_TYPES.map(t => {
              const Icon = t.icon;
              const active = form.customer_type === t.value;
              return (
                <button key={t.value} type="button" disabled={ro}
                  onClick={() => setType(t.value as CustomerType)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 text-center transition-all disabled:cursor-default ${
                    active ? `${t.color} border-current shadow-sm` : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6">

          {/* Contact — all types */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Contact Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Full Name (English)" name="full_name_en" value={form.full_name_en} onChange={hi} disabled={ro} required />
              </div>
              <div className="col-span-2">
                <Field label="Full Name (Arabic)" name="full_name_ar" value={form.full_name_ar} onChange={hi} disabled={ro} dir="rtl" />
              </div>
              <Field label="Phone" name="phone_number" value={form.phone_number} onChange={hi} disabled={ro} required />
              <Field label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} onChange={hi} disabled={ro} />
              <div className="col-span-2">
                <Field label="Email" name="email" value={form.email} onChange={hi} disabled={ro} type="email" />
              </div>
            </div>
          </div>

          {/* UAE Resident */}
          {form.customer_type === 'UAE_RESIDENT' && (
            <>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Personal Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nationality" name="nationality" value={form.nationality} onChange={hi} disabled={ro} />
                  <DateField label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={hi} disabled={ro} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Emirates ID</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={hi} disabled={ro} />
                  <DateField label="ID Expiry Date" name="id_expiry_date" value={form.id_expiry_date} onChange={hi} disabled={ro} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Driving License</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={hi} disabled={ro} required />
                  <DateField label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={hi} disabled={ro} required />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">UAE Address</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Address Line 1" name="address_line_1" value={form.address_line_1} onChange={hi} disabled={ro} />
                  </div>
                  <Field label="City" name="city" value={form.city} onChange={hi} disabled={ro} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emirate</label>
                    <select name="emirate" value={form.emirate} onChange={hi} disabled={ro}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white">
                      <option value="">Select</option>
                      {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tourist */}
          {form.customer_type === 'TOURIST' && (
            <>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Personal Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nationality" name="nationality" value={form.nationality} onChange={hi} disabled={ro} required />
                  <DateField label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={hi} disabled={ro} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Passport & Visa</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Passport Number" name="passport_number" value={form.passport_number} onChange={hi} disabled={ro} required />
                  <DateField label="Passport Expiry" name="passport_expiry" value={form.passport_expiry} onChange={hi} disabled={ro} required />
                  <Field label="Visa / Entry Stamp No." name="visa_number" value={form.visa_number} onChange={hi} disabled={ro} required />
                  <DateField label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={hi} disabled={ro} required />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Driving License</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={hi} disabled={ro} required />
                  <DateField label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={hi} disabled={ro} required />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Stay Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Hotel / Stay Name" name="hotel_name" value={form.hotel_name} onChange={hi} disabled={ro} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Hotel Address" name="hotel_address" value={form.hotel_address} onChange={hi} disabled={ro} />
                  </div>
                  <DateField label="Arrival Date" name="arrival_date" value={form.arrival_date} onChange={hi} disabled={ro} />
                  <DateField label="Departure Date" name="departure_date" value={form.departure_date} onChange={hi} disabled={ro} />
                </div>
              </div>
            </>
          )}

          {/* Company / Corporate */}
          {(form.customer_type === 'COMPANY' || form.customer_type === 'CORPORATE') && (
            <>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Company Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Company Name" name="company_name" value={form.company_name} onChange={hi} disabled={ro} required />
                  </div>
                  <Field label="Trade License No." name="trade_license_number" value={form.trade_license_number} onChange={hi} disabled={ro} required />
                  <DateField label="Trade License Expiry" name="trade_license_expiry" value={form.trade_license_expiry} onChange={hi} disabled={ro} required />
                  <div className="col-span-2">
                    <Field label="TRN Number (VAT)" name="trn_number" value={form.trn_number} onChange={hi} disabled={ro} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Authorized Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Contact Person Name" name="authorized_person_name" value={form.authorized_person_name} onChange={hi} disabled={ro} />
                  </div>
                  <Field label="Contact Mobile" name="authorized_person_mobile" value={form.authorized_person_mobile} onChange={hi} disabled={ro} />
                  <Field label="Company Email" name="email" value={form.email} onChange={hi} disabled={ro} type="email" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Billing & Credit</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Payment Terms</label>
                    <select name="payment_terms" value={form.payment_terms} onChange={hi} disabled={ro}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                      <option value="CASH">Cash</option>
                      <option value="NET_30">Net 30</option>
                      <option value="NET_60">Net 60</option>
                      <option value="MONTHLY">Monthly Invoice</option>
                    </select>
                  </div>
                  <Field label="Credit Limit (AED)" name="credit_limit" value={form.credit_limit} onChange={hi} disabled={ro} type="number" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Address</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Address Line 1" name="address_line_1" value={form.address_line_1} onChange={hi} disabled={ro} />
                  </div>
                  <Field label="City" name="city" value={form.city} onChange={hi} disabled={ro} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Emirate</label>
                    <select name="emirate" value={form.emirate} onChange={hi} disabled={ro}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                      <option value="">Select</option>
                      {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isEdit && ro ? (
            <button onClick={() => setReadOnly(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
              <HiPencilSquare className="w-4 h-4" /> Edit Customer
            </button>
          ) : (
            <div className="flex gap-3">
              {isEdit && (
                <button onClick={() => setReadOnly(true)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Customer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch.trim()) {
        const res = await customerService.searchCustomers(debouncedSearch);
        const items = Array.isArray(res) ? res : (res?.data || []);
        setCustomers(items);
        setTotalCount(items.length);
        setTotalPages(1);
      } else {
        const res = await customerService.getCustomers({ page, limit: 15, ...(typeFilter ? { customer_type: typeFilter } : {}) });
        const items = Array.isArray(res) ? res : (res?.data || res?.results || []);
        setCustomers(items);
        setTotalCount(res?.total || items.length);
        setTotalPages(res?.pages || 1);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAdd = () => { setSelected(null); setDrawerOpen(true); };
  const openEdit = (c: any) => { setSelected(c); setDrawerOpen(true); };

  const docWarnings = (c: any) => {
    const w: string[] = [];
    if (isExpired(c.license_expiry_date)) w.push('License');
    if (isExpired(c.id_expiry_date)) w.push('Emirates ID');
    if (isExpired(c.passport_expiry)) w.push('Passport');
    if (isExpired(c.visa_expiry)) w.push('Visa');
    if (isExpired(c.trade_license_expiry)) w.push('Trade License');
    return w;
  };

  const typeLabel = (val: string) => CUSTOMER_TYPES.find(t => t.value === val)?.label || val;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount > 0 ? `${totalCount} customer${totalCount !== 1 ? 's' : ''}` : 'UAE Residents · Tourists · Companies · Corporate'}
          </p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search customers..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[160px]">
          <option value="">All Types</option>
          {CUSTOMER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiUser className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No customers found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first customer to get started</p>
            <button onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Add Customer
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Docs</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c, i) => {
                const warnings = docWarnings(c);
                const typeBadge = TYPE_BADGE[c.customer_type] || TYPE_BADGE.INDIVIDUAL;
                return (
                  <tr key={c.id} onClick={() => openEdit(c)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-sm text-gray-400">{(page - 1) * 15 + i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
                          {(c.full_name_en || c.company_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.full_name_en || c.company_name}</p>
                          <p className="text-xs text-gray-400">{c.customer_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge}`}>
                        {typeLabel(c.customer_type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{c.phone_number}</td>
                    <td className="px-5 py-4">
                      {warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"
                          title={warnings.join(', ')}>
                          <HiExclamationTriangle className="w-3.5 h-3.5" /> {warnings.length} issue{warnings.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">OK</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {c.is_blacklisted && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Blacklisted</span>
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} · {totalCount} customers</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 bg-white">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 bg-white">Next</button>
          </div>
        </div>
      )}

      {/* Drawer */}
      <CustomerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        customer={selected}
        onSaved={fetchCustomers}
      />
    </div>
  );
}
