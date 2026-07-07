'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiPlus, HiMagnifyingGlass, HiPencilSquare, HiChevronRight,
  HiXMark, HiOutlineUserGroup, HiExclamationTriangle,
} from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { branchService } from '@/services/branch.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const DEPARTMENTS = ['Operations', 'Sales', 'Accounts', 'Fleet', 'Admin', 'HR', 'IT', 'Security', 'Maintenance'];
const JOB_TITLES  = ['Manager', 'Supervisor', 'Front Desk Officer', 'Fleet Officer', 'Accountant', 'Driver', 'Recovery Agent', 'Admin Officer'];

const extract = (r: any) => { const d = r.data; return d && typeof d === 'object' && 'data' in d ? d.data : d; };

const isExpired = (d?: string) => !!d && new Date(d) < new Date();

const emptyForm = {
  full_name: '', employee_number: '', department: '', job_title: '',
  phone_number: '', email: '', branch_id: '',
  emirates_id: '', emirates_id_expiry: '',
  driving_license: '', license_expiry: '',
  visa_number: '', visa_expiry: '',
  date_of_joining: '', notes: '',
};

function Field({ label, name, value, onChange, disabled, type = 'text', placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 bg-white transition-colors" />
    </div>
  );
}

function DateField({ label, name, value, onChange, disabled }: any) {
  const exp = isExpired(value);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input type="date" name={name} value={value} onChange={onChange} disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50 ${exp && value ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`} />
      {exp && value && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <HiExclamationTriangle className="w-3.5 h-3.5" /> Expired
        </p>
      )}
    </div>
  );
}

function SelectField({ label, name, value, onChange, disabled, options, placeholder = 'Select' }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <select name={name} value={value} onChange={onChange} disabled={disabled}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white">
        <option value="">{placeholder}</option>
        {options.map((o: any) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────
function StaffDrawer({ open, onClose, staff, branches, onSaved }: {
  open: boolean; onClose: () => void; staff: any | null; branches: any[]; onSaved: () => void;
}) {
  const [readOnly, setReadOnly] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && staff) {
      setReadOnly(true);
      setForm({
        full_name:          staff.full_name ?? '',
        employee_number:    staff.employee_number ?? '',
        department:         staff.department ?? '',
        job_title:          staff.job_title ?? '',
        phone_number:       staff.phone_number ?? '',
        email:              staff.email ?? '',
        branch_id:          staff.branch_id ?? '',
        emirates_id:        staff.emirates_id ?? '',
        emirates_id_expiry: staff.emirates_id_expiry?.split('T')[0] ?? '',
        driving_license:    staff.driving_license ?? '',
        license_expiry:     staff.license_expiry?.split('T')[0] ?? '',
        visa_number:        staff.visa_number ?? '',
        visa_expiry:        staff.visa_expiry?.split('T')[0] ?? '',
        date_of_joining:    staff.date_of_joining?.split('T')[0] ?? '',
        notes:              staff.notes ?? '',
      });
    }
  }, [open, staff]);

  const hi = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/v1/staff/${staff.id}`, cleanPayload(form));
      toast.success('Staff updated');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save'));
    } finally { setSaving(false); }
  };

  const warnings: string[] = [];
  if (isExpired(form.emirates_id_expiry)) warnings.push('Emirates ID expired');
  if (isExpired(form.license_expiry))     warnings.push('Driving license expired');
  if (isExpired(form.visa_expiry))        warnings.push('Visa expired');

  const ro = readOnly;

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Staff Details</h2>
              {staff && <p className="text-xs text-gray-500">{staff.employee_number || staff.job_title || ''}</p>}
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
              {warnings.map(w => (
                <li key={w} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />{w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-6 pt-4">

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Position</p>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Department" name="department" value={form.department} onChange={hi} disabled={ro}
                options={DEPARTMENTS} />
              <SelectField label="Job Title" name="job_title" value={form.job_title} onChange={hi} disabled={ro}
                options={JOB_TITLES} />
              <div className="col-span-2">
                <SelectField label="Branch" name="branch_id" value={form.branch_id} onChange={hi} disabled={ro}
                  options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
                  placeholder="No specific branch" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Full Name" name="full_name" value={form.full_name} onChange={hi} disabled={ro} />
              </div>
              <Field label="Employee Number" name="employee_number" value={form.employee_number} onChange={hi} disabled={ro} />
              <DateField label="Date of Joining" name="date_of_joining" value={form.date_of_joining} onChange={hi} disabled={ro} />
              <Field label="Phone Number" name="phone_number" value={form.phone_number} onChange={hi} disabled={ro} />
              <Field label="Email" name="email" value={form.email} onChange={hi} disabled={ro} type="email" />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Emirates ID</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={hi} disabled={ro} />
              <DateField label="ID Expiry" name="emirates_id_expiry" value={form.emirates_id_expiry} onChange={hi} disabled={ro} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Driving License</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="License Number" name="driving_license" value={form.driving_license} onChange={hi} disabled={ro} />
              <DateField label="License Expiry" name="license_expiry" value={form.license_expiry} onChange={hi} disabled={ro} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Visa</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Visa Number" name="visa_number" value={form.visa_number} onChange={hi} disabled={ro} />
              <DateField label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={hi} disabled={ro} />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Notes</p>
            <textarea name="notes" value={form.notes}
              onChange={e => !ro && setForm(p => ({ ...p, notes: e.target.value }))}
              disabled={ro} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {ro ? (
            <button onClick={() => setReadOnly(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
              <HiPencilSquare className="w-4 h-4" /> Edit Staff
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setReadOnly(true)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff]         = useState<any[]>([]);
  const [branches, setBranches]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected]   = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        apiClient.get('/v1/staff', { params: { q: debouncedSearch || undefined } }).then(extract),
        branchService.listBranches(),
      ]);
      setStaff(Array.isArray(s) ? s : []);
      setBranches(Array.isArray(b) ? b : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load staff'));
    } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const expiryWarning = (date: string) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (days < 0)  return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>;
    if (days < 30) return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{days}d left</span>;
    return null;
  };

  const docWarnings = (s: any) => {
    let count = 0;
    if (isExpired(s.emirates_id_expiry)) count++;
    if (isExpired(s.license_expiry))     count++;
    if (isExpired(s.visa_expiry))        count++;
    return count;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {staff.length > 0 ? `${staff.length} staff member${staff.length !== 1 ? 's' : ''}` : 'Manage your team members'}
          </p>
        </div>
        <button onClick={() => router.push('/staff/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, phone, employee no..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineUserGroup className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No staff members found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first team member to get started</p>
            <button onClick={() => router.push('/staff/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Add Staff
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff Member</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">License</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Docs</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((s, i) => {
                const warn = docWarnings(s);
                return (
                  <tr key={s.id} onClick={() => { setSelected(s); setDrawerOpen(true); }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                          {(s.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{s.full_name}</p>
                          <p className="text-xs text-gray-400">{s.employee_number || 'No emp no.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{s.job_title || '—'}</p>
                      <p className="text-xs text-gray-400">{s.department || ''}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{s.branch_name || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{s.phone_number || '—'}</td>
                    <td className="px-5 py-4">
                      {s.license_expiry ? (expiryWarning(s.license_expiry) || <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">OK</span>) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {warn > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <HiExclamationTriangle className="w-3.5 h-3.5" /> {warn} issue{warn > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">OK</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
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

      <StaffDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        staff={selected}
        branches={branches}
        onSaved={load}
      />
    </div>
  );
}
