'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineTag, HiOutlineBanknotes, HiOutlineCog6Tooth,
  HiClipboardDocumentCheck, HiOutlinePlusCircle, HiOutlineTrash,
} from 'react-icons/hi2';
import { ratePlanService } from '@/services/rate-plan.service';
import type { CreateRatePlanPayload } from '@/services/rate-plan.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STEPS = [
  { label: 'Plan Info', icon: HiOutlineTag,          desc: 'Name and terms' },
  { label: 'Rates',     icon: HiOutlineBanknotes,    desc: 'Daily, weekly & monthly rates' },
  { label: 'Policies',  icon: HiOutlineCog6Tooth,    desc: 'Fuel & late return rules' },
  { label: 'Review',    icon: HiClipboardDocumentCheck, desc: 'Confirm & create' },
];

const FUEL_TYPES = [
  { value: 'full_to_full', label: 'Full to Full',   desc: 'Customer returns with full tank' },
  { value: 'half_to_full', label: 'Half to Full',   desc: 'Customer fills from half' },
  { value: 'unlimited',    label: 'Unlimited',       desc: 'No fuel charge applied' },
];

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder, step }: { value: string; onChange: (v: string) => void; placeholder?: string; step?: string }) {
  return (
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      step={step ?? '0.01'} placeholder={placeholder ?? '0.00'}
      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
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

export default function CreateRatePlanPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName]           = useState('');
  const [termsText, setTermsText] = useState('');

  // Step 2
  const [dailyRate, setDailyRate]   = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [includedKm, setIncludedKm]   = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');

  // Step 3 — Fuel
  const [fuelType, setFuelType]           = useState('full_to_full');
  const [fuelChargePerUnit, setFuelChargePerUnit] = useState('100');
  // Late return
  const [gracePeriodHours, setGracePeriodHours] = useState('2');
  const [hourlyCharge, setHourlyCharge]         = useState('50');
  const [dailyCap, setDailyCap]                 = useState('150');

  // Add-ons
  const [addOns, setAddOns] = useState<{ name: string; price: string }[]>([]);

  const canNext = () => {
    if (step === 0) return !!name.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const raw: Record<string, unknown> = {
        name: name.trim(),
        daily_rate:          dailyRate    ? Number(dailyRate)    : undefined,
        weekly_rate:         weeklyRate   ? Number(weeklyRate)   : undefined,
        monthly_rate:        monthlyRate  ? Number(monthlyRate)  : undefined,
        deposit_amount:      depositAmount ? Number(depositAmount) : undefined,
        included_km_per_day: includedKm   ? Number(includedKm)  : undefined,
        extra_km_rate:       extraKmRate  ? Number(extraKmRate)  : undefined,
        fuel_policy: {
          type:             fuelType,
          charge_per_unit:  Number(fuelChargePerUnit) || 0,
        },
        late_return_rules: {
          grace_period_hours: Number(gracePeriodHours) || 0,
          hourly_charge:      Number(hourlyCharge) || 0,
          daily_cap:          Number(dailyCap) || 0,
        },
        terms_text: termsText.trim() || undefined,
        add_ons: addOns
          .filter(a => a.name.trim())
          .map(a => ({ name: a.name, price: a.price ? Number(a.price) : 0 })),
      };
      const cleaned = cleanPayload(raw) as unknown as CreateRatePlanPayload;
      await ratePlanService.createRatePlan(cleaned);
      toast.success('Rate plan created');
      router.push('/rate-plans');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create rate plan'));
    } finally { setSubmitting(false); }
  };

  const selectedFuel = FUEL_TYPES.find(f => f.value === fuelType);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/rate-plans')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Rate Plans
          </button>
          <span className="text-sm font-semibold text-gray-900">Create Rate Plan</span>
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
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Plan Info */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <FG title="Plan Details" />
                  <div className="space-y-4">
                    <Field label="Plan Name" required>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="e.g. Economy Daily Plan"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </Field>
                    <Field label="Terms & Conditions">
                      <textarea value={termsText} onChange={e => setTermsText(e.target.value)} rows={4}
                        placeholder="Enter any terms and conditions for this rate plan..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Rates */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <FG title="Rental Rates (AED)" />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Daily Rate"><NumInput value={dailyRate} onChange={setDailyRate} /></Field>
                    <Field label="Weekly Rate"><NumInput value={weeklyRate} onChange={setWeeklyRate} /></Field>
                    <Field label="Monthly Rate"><NumInput value={monthlyRate} onChange={setMonthlyRate} /></Field>
                  </div>
                </div>
                <div>
                  <FG title="Kilometres & Deposit" />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Included KM/Day"><NumInput value={includedKm} onChange={setIncludedKm} placeholder="e.g. 250" step="1" /></Field>
                    <Field label="Extra KM Rate (AED)"><NumInput value={extraKmRate} onChange={setExtraKmRate} placeholder="0.00" /></Field>
                    <Field label="Deposit (AED)"><NumInput value={depositAmount} onChange={setDepositAmount} placeholder="0.00" /></Field>
                  </div>
                </div>
                <div>
                  <FG title="Add-ons (optional)" />
                  <div className="space-y-2">
                    {addOns.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input type="text" value={a.name}
                          onChange={e => setAddOns(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                          placeholder="Add-on name"
                          className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                        <input type="number" step="0.01" value={a.price}
                          onChange={e => setAddOns(prev => prev.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                          placeholder="Price"
                          className="w-28 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                        <button type="button" onClick={() => setAddOns(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setAddOns(prev => [...prev, { name: '', price: '' }])}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
                      <HiOutlinePlusCircle className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Policies */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <FG title="Fuel Policy" />
                  <div className="space-y-3 mb-4">
                    {FUEL_TYPES.map(f => (
                      <button key={f.value} type="button" onClick={() => setFuelType(f.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          fuelType === f.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          fuelType === f.value ? 'border-blue-500' : 'border-gray-300'
                        }`}>
                          {fuelType === f.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{f.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                        </div>
                        {fuelType === f.value && <HiCheck className="w-4 h-4 text-blue-600 ml-auto" />}
                      </button>
                    ))}
                  </div>
                  <Field label="Charge per Litre (AED)">
                    <NumInput value={fuelChargePerUnit} onChange={setFuelChargePerUnit} placeholder="100" />
                  </Field>
                </div>
                <div>
                  <FG title="Late Return Rules" />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Grace Period (hrs)"><NumInput value={gracePeriodHours} onChange={setGracePeriodHours} placeholder="2" step="1" /></Field>
                    <Field label="Hourly Charge (AED)"><NumInput value={hourlyCharge} onChange={setHourlyCharge} placeholder="50" /></Field>
                    <Field label="Daily Cap (AED)"><NumInput value={dailyCap} onChange={setDailyCap} placeholder="150" /></Field>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-violet-500 bg-violet-50">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                    <HiOutlineTag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{name}</p>
                    <p className="text-xs text-violet-600">New Rate Plan</p>
                  </div>
                  {dailyRate && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Daily Rate</p>
                      <p className="font-bold text-gray-900">AED {Number(dailyRate).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Rates</p>
                    <ReviewRow label="Daily"    value={dailyRate   ? `AED ${Number(dailyRate).toLocaleString()}`   : undefined} />
                    <ReviewRow label="Weekly"   value={weeklyRate  ? `AED ${Number(weeklyRate).toLocaleString()}`  : undefined} />
                    <ReviewRow label="Monthly"  value={monthlyRate ? `AED ${Number(monthlyRate).toLocaleString()}` : undefined} />
                    <ReviewRow label="Deposit"  value={depositAmount ? `AED ${Number(depositAmount).toLocaleString()}` : undefined} />
                    <ReviewRow label="KM/Day"   value={includedKm   ? `${includedKm} km` : undefined} />
                    <ReviewRow label="Extra KM" value={extraKmRate  ? `AED ${Number(extraKmRate).toFixed(2)}` : undefined} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Policies</p>
                    <ReviewRow label="Fuel Policy"   value={selectedFuel?.label} />
                    <ReviewRow label="Fuel Charge"   value={`AED ${Number(fuelChargePerUnit).toLocaleString()}/L`} />
                    <ReviewRow label="Grace Period"  value={`${gracePeriodHours} hrs`} />
                    <ReviewRow label="Hourly Charge" value={`AED ${Number(hourlyCharge).toLocaleString()}`} />
                    <ReviewRow label="Daily Cap"     value={`AED ${Number(dailyCap).toLocaleString()}`} />
                  </div>
                </div>

                {addOns.filter(a => a.name.trim()).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Add-ons</p>
                    {addOns.filter(a => a.name.trim()).map((a, i) => (
                      <ReviewRow key={i} label={a.name} value={a.price ? `AED ${Number(a.price).toLocaleString()}` : 'Free'} />
                    ))}
                  </div>
                )}
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
                  : <><HiCheck className="w-4 h-4" />Create Rate Plan</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
