'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineTruck, HiOutlineWrenchScrewdriver, HiClipboardDocumentCheck,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { vehicleService } from '@/services/vehicle.service';
import { cleanPayload, sanitizeUuidFields } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STEPS = [
  { label: 'Vehicle',  icon: HiOutlineTruck,              desc: 'Select the vehicle' },
  { label: 'Details',  icon: HiOutlineWrenchScrewdriver,  desc: 'Type, description & cost' },
  { label: 'Review',   icon: HiClipboardDocumentCheck,    desc: 'Confirm & create' },
];

const WORK_TYPES = [
  { value: 'scheduled',   label: 'Scheduled',   desc: 'Planned routine maintenance',      color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  { value: 'unscheduled', label: 'Unscheduled', desc: 'Unexpected repair needed',          color: 'border-orange-200 bg-orange-50 text-orange-700' },
  { value: 'recall',      label: 'Recall',      desc: 'Manufacturer or safety recall',     color: 'border-red-200 bg-red-50 text-red-700' },
  { value: 'inspection',  label: 'Inspection',  desc: 'Periodic inspection or RTA check',  color: 'border-teal-200 bg-teal-50 text-teal-700' },
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

export default function CreateMaintenancePage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles]         = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const [workType, setWorkType]         = useState('scheduled');
  const [description, setDescription]   = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    vehicleService.getVehicles({ limit: 200 })
      .then(d => setVehicles(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => {});
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      (v.plate_number ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q)
    );
  });

  const canNext = () => {
    if (step === 0) return !!selectedVehicle;
    if (step === 1) return !!description.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = cleanPayload({
        vehicle_id:     selectedVehicle.id,
        type:           workType,
        description:    description.trim(),
        estimated_cost: estimatedCost ? Number(estimatedCost) : null,
        scheduled_date: scheduledDate || null,
      }) as Record<string, unknown>;
      sanitizeUuidFields(payload, ['vehicle_id']);
      await accountsService.createMaintenance(payload as any);
      toast.success('Work order created');
      router.push('/maintenance');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create work order'));
    } finally { setSubmitting(false); }
  };

  const selectedType = WORK_TYPES.find(t => t.value === workType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/maintenance')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Maintenance
          </button>
          <span className="text-sm font-semibold text-gray-900">Create Work Order</span>
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
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return (
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-orange-600" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Vehicle */}
            {step === 0 && (
              <div>
                <FG title="Search Vehicle" />
                <div className="relative mb-3">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="text" value={vehicleSearch}
                    onChange={e => { setVehicleSearch(e.target.value); setSelectedVehicle(null); }}
                    placeholder="Search by plate, make or model..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  {filteredVehicles.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-400 text-center">No vehicles found</p>
                  ) : filteredVehicles.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setVehicleSearch(`${v.make} ${v.model} — ${v.plate_number}`); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm border-b last:border-0 border-gray-50 transition-colors ${
                        selectedVehicle?.id === v.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}>
                      <div>
                        <p className="font-medium text-gray-900">{v.make} {v.model} <span className="text-gray-400 font-normal">({v.year})</span></p>
                        <p className="font-mono text-xs text-gray-400 mt-0.5">{v.plate_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{v.status}</span>
                        {selectedVehicle?.id === v.id && <HiCheck className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedVehicle && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <HiOutlineTruck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedVehicle.make} {selectedVehicle.model}</p>
                      <p className="font-mono text-xs text-blue-700">{selectedVehicle.plate_number}</p>
                    </div>
                    <HiCheck className="w-5 h-5 text-blue-600 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <FG title="Work Type" />
                  <div className="grid grid-cols-2 gap-3">
                    {WORK_TYPES.map(t => (
                      <button key={t.value} type="button"
                        onClick={() => setWorkType(t.value)}
                        className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                          workType === t.value ? t.color : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${workType === t.value ? '' : 'text-gray-900'}`}>{t.label}</span>
                          {workType === t.value && <HiCheck className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs ${workType === t.value ? 'opacity-70' : 'text-gray-500'}`}>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FG title="Work Details" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                        placeholder="Describe the maintenance work to be done..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Cost (AED)</label>
                        <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Scheduled Date</label>
                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-orange-400 bg-orange-50">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <HiOutlineWrenchScrewdriver className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedVehicle?.make} {selectedVehicle?.model}</p>
                    <p className="font-mono text-xs text-orange-700">{selectedVehicle?.plate_number}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${selectedType?.color}`}>
                      {selectedType?.label}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Vehicle"        value={`${selectedVehicle?.make} ${selectedVehicle?.model}`} />
                  <ReviewRow label="Plate"          value={selectedVehicle?.plate_number} />
                  <ReviewRow label="Type"           value={selectedType?.label} />
                  <ReviewRow label="Description"    value={description} />
                  <ReviewRow label="Estimated Cost" value={estimatedCost ? `AED ${Number(estimatedCost).toLocaleString()}` : undefined} />
                  <ReviewRow label="Scheduled Date" value={scheduledDate ? new Date(scheduledDate).toLocaleDateString() : undefined} />
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
