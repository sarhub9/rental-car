'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineTruck, HiOutlineClipboardDocumentList, HiClipboardDocumentCheck,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { workOrderService } from '@/services/work-order.service';
import { getVehicles } from '@/services/vehicle.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const TYPE_OPTIONS = ['scheduled', 'unscheduled', 'recall', 'inspection'];

const STEPS = [
  { label: 'Vehicle',  icon: HiOutlineTruck,                  desc: 'Select the vehicle' },
  { label: 'Details',  icon: HiOutlineClipboardDocumentList,  desc: 'Work type, description & date' },
  { label: 'Review',   icon: HiClipboardDocumentCheck,        desc: 'Confirm & create' },
];

const emptyForm = {
  vehicle_id: '',
  type: 'scheduled',
  description: '',
  estimated_cost: '',
  scheduled_date: '',
};

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

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[58%] capitalize">{value}</span>
    </div>
  );
}

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    getVehicles({ limit: 200 }).then((res: any) => {
      setVehicles(Array.isArray(res) ? res : (res?.data || []));
    }).catch(() => {});
  }, []);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const filteredVehicles = vehicles.filter((v: any) => {
    if (!vehicleSearch.trim()) return vehicles.slice(0, 8);
    const q = vehicleSearch.toLowerCase();
    return (
      (v.plate_number ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const canNext = () => {
    if (step === 0) return !!form.vehicle_id;
    if (step === 1) return !!form.description.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { ...form };
      if (payload.estimated_cost) payload.estimated_cost = Number(payload.estimated_cost);
      else delete payload.estimated_cost;
      await workOrderService.createWorkOrder(cleanPayload(payload));
      toast.success('Work order created');
      router.push('/work-orders');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create work order'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/work-orders')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Work Orders
          </button>
          <span className="text-sm font-semibold text-gray-900">Create Work Order</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Steps */}
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
          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Vehicle */}
            {step === 0 && (
              <div>
                <FG title="Select Vehicle" />
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={vehicleSearch}
                    onChange={e => { setVehicleSearch(e.target.value); setShowDrop(true); if (!e.target.value) { setSelectedVehicle(null); setForm(f => ({ ...f, vehicle_id: '' })); } }}
                    onFocus={() => setShowDrop(true)}
                    placeholder="Search by plate, make or model..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  {showDrop && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredVehicles.length > 0 ? filteredVehicles.map((v: any) => (
                        <button key={v.id} type="button"
                          onClick={() => { setSelectedVehicle(v); setVehicleSearch(`${v.plate_number} — ${v.make} ${v.model}`); setForm(f => ({ ...f, vehicle_id: v.id })); setShowDrop(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50/60 transition-colors text-sm">
                          <span className="font-medium text-gray-900">{v.make} {v.model} <span className="text-gray-400 font-normal">({v.year})</span></span>
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{v.plate_number}</span>
                        </button>
                      )) : (
                        <p className="px-4 py-3 text-sm text-gray-400">No vehicles found</p>
                      )}
                    </div>
                  )}
                </div>
                {selectedVehicle && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                      <HiOutlineTruck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</p>
                      <p className="text-sm text-emerald-700 font-mono">{selectedVehicle.plate_number}</p>
                    </div>
                    <div className="ml-auto">
                      <HiCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 1 && (
              <>
                <div>
                  <FG title="Work Type" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TYPE_OPTIONS.map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(p => ({ ...p, type: t }))}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold capitalize transition-all text-center ${
                          form.type === t
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FG title="Work Description" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea name="description" value={form.description} onChange={set} rows={4}
                        placeholder="Describe the work to be done..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <F label="Estimated Cost (AED)" name="estimated_cost" value={form.estimated_cost} onChange={set} type="number" placeholder="0.00" />
                      <F label="Scheduled Date" name="scheduled_date" value={form.scheduled_date} onChange={set} type="date" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Review */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <HiOutlineTruck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedVehicle?.make} {selectedVehicle?.model}</p>
                    <p className="text-xs font-mono text-blue-700">{selectedVehicle?.plate_number}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Work Order Details</p>
                  <ReviewRow label="Type" value={form.type} />
                  <ReviewRow label="Description" value={form.description} />
                  <ReviewRow label="Est. Cost" value={form.estimated_cost ? `AED ${Number(form.estimated_cost).toLocaleString()}` : undefined} />
                  <ReviewRow label="Scheduled Date" value={form.scheduled_date} />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
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
                  : <><HiCheck className="w-4 h-4" />Create Work Order</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
