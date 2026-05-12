'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineBuildingOffice2, HiOutlinePhone, HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import { branchService } from '@/services/branch.service';
import { extractApiError } from '@/lib/api-error';
import { cleanPayload } from '@/lib/clean-payload';

const STEPS = [
  { label: 'Branch Info', icon: HiOutlineBuildingOffice2, desc: 'Name and identifier' },
  { label: 'Contact',     icon: HiOutlinePhone,           desc: 'Phone, email & address' },
  { label: 'Review',      icon: HiClipboardDocumentCheck, desc: 'Confirm & create' },
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

export default function CreateBranchPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [address, setAddress]       = useState('');

  const canNext = () => {
    if (step === 0) return !!branchName.trim() && !!branchCode.trim();
    if (step === 1) return true;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await branchService.createBranch(cleanPayload({
        branch_name: branchName.trim(),
        branch_code: branchCode.trim(),
        phone:       phone.trim(),
        email:       email.trim(),
        address:     address.trim(),
      }));
      toast.success('Branch created');
      router.push('/branches');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create branch'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/branches')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Branches
          </button>
          <span className="text-sm font-semibold text-gray-900">Add Branch</span>
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
          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Branch Info */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <FG title="Branch Identity" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={branchName} onChange={e => setBranchName(e.target.value)}
                        placeholder="e.g. Dubai Marina Branch"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Branch Code <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={branchCode}
                        onChange={e => setBranchCode(e.target.value.toUpperCase())}
                        placeholder="DXB-01"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Short unique identifier, e.g. DXB-01, AUH-02</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Contact */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <FG title="Contact Details" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+971 4 xxx xxxx"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="branch@company.com"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                      <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3}
                        placeholder="Full branch address..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
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
                    <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{branchName}</p>
                    <p className="text-xs font-mono text-blue-600">{branchCode}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Branch Name" value={branchName} />
                  <ReviewRow label="Branch Code" value={branchCode} />
                  <ReviewRow label="Phone"       value={phone} />
                  <ReviewRow label="Email"       value={email} />
                  <ReviewRow label="Address"     value={address} />
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
                  : <><HiCheck className="w-4 h-4" />Create Branch</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
