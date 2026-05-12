'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineShieldCheck, HiOutlineUser, HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import { adminService } from '@/services/admin.service';
import { extractApiError } from '@/lib/api-error';

const STEPS = [
  { label: 'Role',    icon: HiOutlineShieldCheck,       desc: 'Set role & access level' },
  { label: 'Details', icon: HiOutlineUser,              desc: 'Personal & login details' },
  { label: 'Review',  icon: HiClipboardDocumentCheck,   desc: 'Confirm & create' },
];

const ROLES = [
  { value: 'OWNER_ADMIN',     label: 'Owner Admin',      desc: 'Full administrative access',    color: 'bg-red-50 border-red-200 text-red-700' },
  { value: 'FRONT_DESK',      label: 'Front Desk',        desc: 'Agreements, customers, reservations', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: 'FLEET_MANAGER',   label: 'Fleet Manager',     desc: 'Vehicles, maintenance, tasks',  color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { value: 'ACCOUNTS',        label: 'Accounts',          desc: 'Invoices, payments, refunds',   color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: 'DRIVER_RECOVERY', label: 'Driver / Recovery', desc: 'Driver tasks, vehicle recovery', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
];

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
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

export default function CreateUserPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole]           = useState('FRONT_DESK');
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');

  const canNext = () => {
    if (step === 0) return !!role;
    if (step === 1) return !!fullName.trim() && !!email.trim() && !!phone.trim() && !!password;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await adminService.createUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        role,
        password,
      });
      toast.success('User created successfully');
      router.push('/admin/users');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create user'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/admin/users')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Users
          </button>
          <span className="text-sm font-semibold text-gray-900">Add User</span>
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
                    done ? 'bg-blue-600 border-blue-600 text-white' :
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
          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Role */}
            {step === 0 && (
              <div>
                <FG title="Select Role" />
                <div className="space-y-3">
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setRole(r.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        role === r.value
                          ? `${r.color} border-current`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        role === r.value ? 'border-current' : 'border-gray-300'
                      }`}>
                        {role === r.value && <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${role === r.value ? '' : 'text-gray-900'}`}>{r.label}</p>
                        <p className={`text-xs mt-0.5 ${role === r.value ? 'opacity-70' : 'text-gray-500'}`}>{r.desc}</p>
                      </div>
                      {role === r.value && <HiCheck className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <FG title="Personal Information" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+971 50 000 0000"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <FG title="Login Credentials" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="user@company.com"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Set a strong password"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Minimum 8 characters recommended</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <HiOutlineUser className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${selectedRole?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {selectedRole?.label}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Full Name"  value={fullName} />
                  <ReviewRow label="Email"      value={email} />
                  <ReviewRow label="Phone"      value={phone} />
                  <ReviewRow label="Role"       value={selectedRole?.label} />
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
              <button onClick={handleSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  : <><HiCheck className="w-4 h-4" />Create User</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
