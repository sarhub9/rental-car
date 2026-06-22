'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleService } from '@/services/vehicle.service';
import type { CreateVehiclePayload } from '@/services/vehicle.service';
import toast from 'react-hot-toast';
import { cleanPayload, sanitizeUuidFields } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';
import { DocumentUpload } from '@/components/DocumentUpload';
import {
  HiCheck, HiChevronLeft, HiChevronRight, HiChevronDown,
  HiTruck, HiIdentification, HiDocumentText,
  HiCurrencyDollar, HiClipboardDocumentCheck,
  HiExclamationTriangle,
} from 'react-icons/hi2';

const STEPS = [
  { label: 'Basic Info',  icon: HiTruck,                 desc: 'Make, model, year & specs' },
  { label: 'Plate',       icon: HiIdentification,         desc: 'Plate number & chassis ID' },
  { label: 'Documents',   icon: HiDocumentText,           desc: 'Insurance & expiry dates' },
  { label: 'Pricing',     icon: HiCurrencyDollar,         desc: 'Daily, weekly & monthly rates' },
  { label: 'Review',      icon: HiClipboardDocumentCheck, desc: 'Confirm all details' },
];

const TRANSMISSION_TYPES = ['AUTOMATIC', 'MANUAL'];
const FUEL_TYPES         = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'];
const BODY_TYPES         = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'PICKUP', 'VAN', 'MINIBUS', 'CONVERTIBLE', 'WAGON'];
const EMIRATES           = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const isExp = (d?: string) => !!d && new Date(d) < new Date();

// ── Shared field components ──────────────────────────────────────────────────
function FieldGroup({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function F({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }: {
  label: string; name: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
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

function S({ label, name, value, onChange, options, required = false }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} required={required}
          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
          <option value="">Select {label}</option>
          {options.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase().replace(/_/g, ' ')}</option>)}
        </select>
        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function D({ label, name, value, onChange, required = false }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) {
  const exp = isExp(value);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="date" name={name} value={value} onChange={onChange} required={required}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:outline-none transition-all ${exp && value ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-500/10 focus:border-red-400' : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/10'}`} />
      {exp && value && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <HiExclamationTriangle className="w-3.5 h-3.5" /> Document already expired
        </p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CreateVehiclePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear(), color: '',
    transmission_type: 'AUTOMATIC', fuel_type: 'PETROL', body_type: '', seats: '',
    plate_number: '', plate_emirate: '', chassis_number: '',
    registration_expiry: '', insurance_company: '', insurance_policy: '', insurance_expiry: '',
    daily_rate: '', weekly_rate: '', monthly_rate: '', current_odometer: '', category_id: '',
    km_allowance_per_day: '', rate_per_extra_km: '',
    photo_front_url: '', photo_rear_url: '', photo_side_url: '', photo_interior_url: '',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const setPhoto = (key: string) => (url: string) =>
    setForm(p => ({ ...p, [key]: url }));

  const canNext = () => {
    if (step === 0) return !!form.make.trim() && !!form.model.trim() && !!form.year;
    if (step === 1) return !!form.plate_number.trim() && !!form.plate_emirate;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const raw: Record<string, unknown> = {
        make: form.make, model: form.model, year: Number(form.year),
        color: form.color || undefined, plate_number: form.plate_number,
        plate_emirate: form.plate_emirate || undefined,
        chassis_number: form.chassis_number || undefined,
        transmission_type: form.transmission_type || undefined,
        fuel_type: form.fuel_type || undefined,
        body_type: form.body_type || undefined,
        seats: form.seats ? Number(form.seats) : undefined,
        registration_expiry: form.registration_expiry || undefined,
        insurance_expiry: form.insurance_expiry || undefined,
        insurance_company: form.insurance_company || undefined,
        insurance_policy: form.insurance_policy || undefined,
        daily_rate: form.daily_rate ? Number(form.daily_rate) : undefined,
        weekly_rate: form.weekly_rate ? Number(form.weekly_rate) : undefined,
        monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
        km_allowance_per_day: form.km_allowance_per_day ? Number(form.km_allowance_per_day) : undefined,
        rate_per_extra_km: form.rate_per_extra_km ? Number(form.rate_per_extra_km) : undefined,
        current_odometer: form.current_odometer ? Number(form.current_odometer) : undefined,
        category_id: form.category_id || undefined,
        photo_front_url: form.photo_front_url || undefined,
        photo_rear_url: form.photo_rear_url || undefined,
        photo_side_url: form.photo_side_url || undefined,
        photo_interior_url: form.photo_interior_url || undefined,
      };
      const cleaned = cleanPayload(raw) as Record<string, unknown>;
      sanitizeUuidFields(cleaned, ['category_id']);
      await vehicleService.createVehicle(cleaned as unknown as CreateVehiclePayload);
      toast.success('Vehicle added to fleet');
      router.push('/vehicles');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to add vehicle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/vehicles')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Vehicles
          </button>
          <span className="text-sm font-semibold text-gray-900">Add New Vehicle</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Step indicator ─────────────────────────────────────── */}
        <div className="flex items-start mb-8">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {done ? <HiCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center leading-tight px-1 ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mt-[18px] mx-1 rounded-full" style={{ background: i < step ? '#2563EB' : '#E5E7EB' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Form card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5 text-blue-600" /></div>; })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Basic Info */}
            {step === 0 && (
              <>
                <div>
                  <FieldGroup title="Vehicle" />
                  <div className="grid grid-cols-3 gap-4">
                    <F label="Make" name="make" value={form.make} onChange={set} required placeholder="Toyota" />
                    <F label="Model" name="model" value={form.model} onChange={set} required placeholder="Camry" />
                    <F label="Year" name="year" value={form.year} onChange={set} type="number" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <F label="Color" name="color" value={form.color} onChange={set} placeholder="White" />
                    <F label="Seats" name="seats" value={form.seats} onChange={set} type="number" placeholder="5" />
                  </div>
                </div>
                <div>
                  <FieldGroup title="Specifications" />
                  <div className="grid grid-cols-3 gap-4">
                    <S label="Transmission" name="transmission_type" value={form.transmission_type} onChange={set} options={TRANSMISSION_TYPES} />
                    <S label="Fuel Type" name="fuel_type" value={form.fuel_type} onChange={set} options={FUEL_TYPES} />
                    <S label="Body Type" name="body_type" value={form.body_type} onChange={set} options={BODY_TYPES} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Plate */}
            {step === 1 && (
              <>
                <div>
                  <FieldGroup title="Plate Details" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Plate Number" name="plate_number" value={form.plate_number} onChange={set} required placeholder="A 12345" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Plate Emirate<span className="text-red-500 ml-0.5">*</span></label>
                      <div className="relative">
                        <select name="plate_emirate" value={form.plate_emirate} onChange={set} required
                          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
                          <option value="">Select Emirate</option>
                          {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <FieldGroup title="Identification" />
                  <F label="Chassis / VIN Number" name="chassis_number" value={form.chassis_number} onChange={set} placeholder="1HGBH41JXMN109186" />
                </div>
                {form.plate_number && form.plate_emirate && (
                  <div className="rounded-xl bg-gray-900 p-5 flex items-center gap-5">
                    <div className="bg-white rounded-lg px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] font-black text-[#003DA5] tracking-widest mb-1">UAE</p>
                      <p className="text-xl font-black text-gray-900 tracking-wider leading-none">{form.plate_number}</p>
                      <p className="text-[9px] text-gray-500 mt-1 tracking-wide">{form.plate_emirate.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{form.plate_number} · {form.plate_emirate}</p>
                      {form.chassis_number && <p className="text-gray-400 text-xs mt-1 font-mono">{form.chassis_number}</p>}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 3 — Documents */}
            {step === 2 && (
              <>
                <div>
                  <FieldGroup title="Registration" />
                  <div className="grid grid-cols-2 gap-4">
                    <D label="Mulkiya / Reg. Expiry" name="registration_expiry" value={form.registration_expiry} onChange={set} />
                    <div className={`rounded-xl p-4 border flex items-center gap-3 ${form.registration_expiry ? (isExp(form.registration_expiry) ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200') : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${form.registration_expiry ? (isExp(form.registration_expiry) ? 'bg-red-500' : 'bg-emerald-500') : 'bg-gray-300'}`} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Status</p>
                        <p className={`text-sm font-bold ${form.registration_expiry ? (isExp(form.registration_expiry) ? 'text-red-600' : 'text-emerald-600') : 'text-gray-400'}`}>
                          {form.registration_expiry ? (isExp(form.registration_expiry) ? 'Expired' : 'Valid') : 'Not entered'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <FieldGroup title="Insurance" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Insurance Company" name="insurance_company" value={form.insurance_company} onChange={set} placeholder="AXA / ADNIC / RSA" />
                    <F label="Policy Number" name="insurance_policy" value={form.insurance_policy} onChange={set} placeholder="POL-2024-XXXXX" />
                    <D label="Insurance Expiry" name="insurance_expiry" value={form.insurance_expiry} onChange={set} />
                    <div className={`rounded-xl p-4 border flex items-center gap-3 ${form.insurance_expiry ? (isExp(form.insurance_expiry) ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200') : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${form.insurance_expiry ? (isExp(form.insurance_expiry) ? 'bg-red-500' : 'bg-emerald-500') : 'bg-gray-300'}`} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Status</p>
                        <p className={`text-sm font-bold ${form.insurance_expiry ? (isExp(form.insurance_expiry) ? 'text-red-600' : 'text-emerald-600') : 'text-gray-400'}`}>
                          {form.insurance_expiry ? (isExp(form.insurance_expiry) ? 'Expired' : 'Valid') : 'Not entered'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <FieldGroup title="Vehicle Photos" />
                  <div className="grid grid-cols-2 gap-4">
                    <DocumentUpload label="Front" category="vehicle-photos" docKey="FRONT" value={form.photo_front_url} onChange={setPhoto('photo_front_url')} />
                    <DocumentUpload label="Rear" category="vehicle-photos" docKey="REAR" value={form.photo_rear_url} onChange={setPhoto('photo_rear_url')} />
                    <DocumentUpload label="Side" category="vehicle-photos" docKey="SIDE" value={form.photo_side_url} onChange={setPhoto('photo_side_url')} />
                    <DocumentUpload label="Interior" category="vehicle-photos" docKey="INTERIOR" value={form.photo_interior_url} onChange={setPhoto('photo_interior_url')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 4 — Pricing */}
            {step === 3 && (
              <>
                <div>
                  <FieldGroup title="Rental Rates (AED)" />
                  <div className="grid grid-cols-3 gap-4">
                    {[{ key: 'daily_rate', label: 'Daily' }, { key: 'weekly_rate', label: 'Weekly' }, { key: 'monthly_rate', label: 'Monthly' }].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} Rate</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">AED</span>
                          <input type="number" name={key} value={(form as any)[key]} onChange={set} min={0} step="0.01" placeholder="0"
                            className="w-full pl-12 pr-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {(Number(form.daily_rate) > 0 || Number(form.weekly_rate) > 0 || Number(form.monthly_rate) > 0) && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[{ key: 'daily_rate', label: 'Daily' }, { key: 'weekly_rate', label: 'Weekly' }, { key: 'monthly_rate', label: 'Monthly' }].map(({ key, label }) =>
                        Number((form as any)[key]) > 0 ? (
                          <div key={key} className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                            <p className="text-xs text-blue-500 font-semibold">{label}</p>
                            <p className="text-lg font-black text-blue-700 mt-0.5">AED {Number((form as any)[key]).toFixed(0)}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <FieldGroup title="Mileage Policy" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Allowed KM / Day" name="km_allowance_per_day" value={form.km_allowance_per_day} onChange={set} type="number" placeholder="250" />
                    <F label="Extra KM Rate (AED)" name="rate_per_extra_km" value={form.rate_per_extra_km} onChange={set} type="number" placeholder="0.50" />
                  </div>
                </div>
                <div>
                  <FieldGroup title="Fleet Setup" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Current Odometer (km)" name="current_odometer" value={form.current_odometer} onChange={set} type="number" placeholder="0" />
                    <F label="Vehicle Category ID" name="category_id" value={form.category_id} onChange={set} placeholder="Optional — paste category UUID" />
                  </div>
                </div>
              </>
            )}

            {/* Step 5 — Review */}
            {step === 4 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Vehicle</p>
                    <ReviewRow label="Make & Model" value={`${form.make} ${form.model}`} />
                    <ReviewRow label="Year" value={form.year} />
                    <ReviewRow label="Color" value={form.color} />
                    <ReviewRow label="Body Type" value={form.body_type} />
                    <ReviewRow label="Transmission" value={form.transmission_type} />
                    <ReviewRow label="Fuel" value={form.fuel_type} />
                    <ReviewRow label="Seats" value={form.seats} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Plate & Docs</p>
                    <ReviewRow label="Plate" value={`${form.plate_number} · ${form.plate_emirate}`} />
                    <ReviewRow label="Chassis" value={form.chassis_number} />
                    <ReviewRow label="Reg. Expiry" value={form.registration_expiry} />
                    <ReviewRow label="Ins. Company" value={form.insurance_company} />
                    <ReviewRow label="Ins. Expiry" value={form.insurance_expiry} />
                  </div>
                  {(Number(form.daily_rate) > 0 || Number(form.weekly_rate) > 0 || Number(form.monthly_rate) > 0) && (
                    <div className="sm:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Pricing</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[{ key: 'daily_rate', label: 'Daily' }, { key: 'weekly_rate', label: 'Weekly' }, { key: 'monthly_rate', label: 'Monthly' }].map(({ key, label }) => (
                          <div key={key}><p className="text-xs text-blue-500">{label}</p><p className="font-black text-blue-700 mt-0.5">{(form as any)[key] ? `AED ${(form as any)[key]}` : '—'}</p></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {(!form.make || !form.model || !form.plate_number || !form.plate_emirate) && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    <HiExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                    Required fields missing — go back and complete Make, Model, Plate Number and Emirate.
                  </div>
                )}
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
              <button onClick={handleSubmit}
                disabled={submitting || !form.make || !form.model || !form.plate_number || !form.plate_emirate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><HiCheck className="w-4 h-4" />Add Vehicle</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
