'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight, HiChevronDown,
  HiUser, HiPhone, HiDocumentText, HiClipboardDocumentCheck,
  HiExclamationTriangle, HiOutlineBriefcase,
} from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { branchService } from '@/services/branch.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const DEPARTMENTS = ['Operations', 'Sales', 'Accounts', 'Fleet', 'Admin', 'HR', 'IT', 'Security', 'Maintenance'];
const JOB_TITLES  = ['Manager', 'Supervisor', 'Front Desk Officer', 'Fleet Officer', 'Accountant', 'Driver', 'Recovery Agent', 'Admin Officer'];

const STEPS = [
  { label: 'Role',      icon: HiOutlineBriefcase,       desc: 'Department, title & branch'  },
  { label: 'Personal',  icon: HiUser,                   desc: 'Name, employee number & contact' },
  { label: 'Documents', icon: HiDocumentText,            desc: 'ID, license & visa details'  },
  { label: 'Review',    icon: HiClipboardDocumentCheck,  desc: 'Confirm & create'            },
];

const isExp = (d?: string) => !!d && new Date(d) < new Date();

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function F({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
    </div>
  );
}

function D({ label, name, value, onChange, required = false }: any) {
  const exp = isExp(value);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="date" name={name} value={value} onChange={onChange} required={required}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:outline-none transition-all ${
          exp && value
            ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-500/10 focus:border-red-400'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/10'
        }`} />
      {exp && value && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <HiExclamationTriangle className="w-3.5 h-3.5" />Expired
        </p>
      )}
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder = 'Select', required = false }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange}
          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
          <option value="">{placeholder}</option>
          {options.map((o: any) => (
            <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
              {typeof o === 'string' ? o : o.label}
            </option>
          ))}
        </select>
        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[58%]">{value}</span>
    </div>
  );
}

const emptyForm = {
  full_name: '', employee_number: '', department: '', job_title: '',
  phone_number: '', email: '', branch_id: '',
  emirates_id: '', emirates_id_expiry: '',
  driving_license: '', license_expiry: '',
  visa_number: '', visa_expiry: '',
  date_of_joining: '', notes: '',
};

export default function CreateStaffPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });
  const [branches, setBranches] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    branchService.listBranches()
      .then(res => setBranches(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const canNext = () => {
    if (step === 0) return !!form.department || !!form.job_title;
    if (step === 1) return !!form.full_name.trim();
    return true;
  };

  const branchName = branches.find(b => b.id === form.branch_id)?.branch_name || '—';

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/v1/staff', cleanPayload(form));
      toast.success('Staff member created');
      router.push('/staff');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create staff'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/staff')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Staff
          </button>
          <span className="text-sm font-semibold text-gray-900">Add New Staff Member</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Step indicator */}
        <div className="flex items-start mb-8">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    done   ? 'bg-blue-600 border-blue-600 text-white' :
                    active ? 'bg-white border-blue-600 text-blue-600' :
                             'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <HiCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center leading-tight px-1 ${
                    active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mt-[18px] mx-1 rounded-full"
                    style={{ background: i < step ? '#2563EB' : '#E5E7EB' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return (
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Role */}
            {step === 0 && (
              <>
                <div>
                  <FG title="Position" />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Department" name="department" value={form.department}
                      onChange={set} options={DEPARTMENTS} placeholder="Select department" />
                    <SelectField label="Job Title" name="job_title" value={form.job_title}
                      onChange={set} options={JOB_TITLES} placeholder="Select title" />
                  </div>
                </div>
                <div>
                  <FG title="Assignment" />
                  <SelectField label="Branch" name="branch_id" value={form.branch_id}
                    onChange={set}
                    options={branches.map(b => ({ value: b.id, label: b.branch_name }))}
                    placeholder="No specific branch" />
                </div>
              </>
            )}

            {/* Step 2 — Personal */}
            {step === 1 && (
              <>
                <div>
                  <FG title="Identity" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <F label="Full Name" name="full_name" value={form.full_name} onChange={set} required placeholder="Ahmed Al Mansouri" />
                    </div>
                    <F label="Employee Number" name="employee_number" value={form.employee_number} onChange={set} placeholder="EMP-001" />
                    <D label="Date of Joining" name="date_of_joining" value={form.date_of_joining} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Contact" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Phone Number" name="phone_number" value={form.phone_number} onChange={set} placeholder="+971 50 000 0000" />
                    <F label="Email" name="email" value={form.email} onChange={set} type="email" placeholder="staff@company.com" />
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Documents */}
            {step === 2 && (
              <>
                <div>
                  <FG title="Emirates ID" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={set} placeholder="784-XXXX-XXXXXXX-X" />
                    <D label="Emirates ID Expiry" name="emirates_id_expiry" value={form.emirates_id_expiry} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Driving License" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="License Number" name="driving_license" value={form.driving_license} onChange={set} />
                    <D label="License Expiry" name="license_expiry" value={form.license_expiry} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Visa" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Visa Number" name="visa_number" value={form.visa_number} onChange={set} />
                    <D label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Notes" />
                  <textarea name="notes" value={form.notes}
                    onChange={set} rows={3}
                    placeholder="Any additional notes..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none" />
                </div>
              </>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <HiOutlineBriefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{form.job_title || 'Staff Member'}</p>
                    <p className="text-xs text-gray-500">{form.department || 'No department'} {branchName !== '—' ? `· ${branchName}` : ''}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Personal</p>
                    <ReviewRow label="Full Name"        value={form.full_name} />
                    <ReviewRow label="Employee No."     value={form.employee_number} />
                    <ReviewRow label="Phone"            value={form.phone_number} />
                    <ReviewRow label="Email"            value={form.email} />
                    <ReviewRow label="Date of Joining"  value={form.date_of_joining} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Documents</p>
                    <ReviewRow label="Emirates ID"      value={form.emirates_id} />
                    <ReviewRow label="ID Expiry"        value={form.emirates_id_expiry} />
                    <ReviewRow label="Driving License"  value={form.driving_license} />
                    <ReviewRow label="License Expiry"   value={form.license_expiry} />
                    <ReviewRow label="Visa No."         value={form.visa_number} />
                    <ReviewRow label="Visa Expiry"      value={form.visa_expiry} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <HiChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs text-gray-400 font-medium">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                Continue <HiChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || !form.full_name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  : <><HiCheck className="w-4 h-4" />Create Staff</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
