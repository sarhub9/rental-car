'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { driverService } from '@/services/driver.service';
import { extractApiError } from '@/lib/api-error';
import { COUNTRIES } from '@/lib/countries';
import { DocumentUpload } from '@/components/DocumentUpload';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight, HiChevronDown,
  HiUser, HiUsers, HiIdentification, HiDocumentText, HiClipboardDocumentCheck,
  HiExclamationTriangle, HiTruck, HiKey,
  HiOutlineBuildingOffice2, HiBuildingOffice2,
} from 'react-icons/hi2';

const STEPS = [
  { label: 'Type',    icon: HiUser,                   desc: 'Select driver role' },
  { label: 'Info',    icon: HiIdentification,          desc: 'Name & contact details' },
  { label: 'License', icon: HiDocumentText,            desc: 'Driving license & IDP' },
  { label: 'ID Docs', icon: HiClipboardDocumentCheck,  desc: 'Emirates ID & passport' },
  { label: 'Review',  icon: HiCheck,                   desc: 'Confirm & create driver' },
];

const DRIVER_TYPES = [
  { value: 'MAIN_CUSTOMER',    label: 'Main Customer',      desc: 'Primary driver on rental',       icon: HiUser,                   bg: 'bg-blue-50',   border: 'border-blue-200',   activeBorder: 'border-blue-500',   iconBg: 'bg-blue-600' },
  { value: 'ADDITIONAL',       label: 'Additional Driver',  desc: 'Extra driver on agreement',      icon: HiUsers,                  bg: 'bg-cyan-50',   border: 'border-cyan-200',   activeBorder: 'border-cyan-500',   iconBg: 'bg-cyan-600' },
  { value: 'COMPANY',          label: 'Company Driver',     desc: 'Authorized by company account',  icon: HiOutlineBuildingOffice2, bg: 'bg-orange-50', border: 'border-orange-200', activeBorder: 'border-orange-500', iconBg: 'bg-orange-600' },
  { value: 'CORPORATE',        label: 'Corporate Driver',   desc: 'On corporate approved list',     icon: HiBuildingOffice2,        bg: 'bg-purple-50', border: 'border-purple-200', activeBorder: 'border-purple-500', iconBg: 'bg-purple-600' },
  { value: 'STAFF_DELIVERY',   label: 'Staff – Delivery',   desc: 'Internal delivery driver',       icon: HiTruck,                  bg: 'bg-green-50',  border: 'border-green-200',  activeBorder: 'border-green-500',  iconBg: 'bg-green-600' },
  { value: 'STAFF_COLLECTION', label: 'Staff – Collection', desc: 'Internal collection driver',     icon: HiKey,                    bg: 'bg-teal-50',   border: 'border-teal-200',   activeBorder: 'border-teal-500',   iconBg: 'bg-teal-600' },
] as const;

type DriverTypeValue = typeof DRIVER_TYPES[number]['value'];

const LICENSE_COUNTRIES = ['UAE', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman', 'Qatar', 'UK', 'USA', 'India', 'Pakistan', 'Philippines', 'Other'];

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

function S({ label, name, value, onChange, options, required = false, placeholder = 'Select' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange} required={required}
          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
          <option value="">{placeholder}</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function D({ label, name, value, onChange, required = false, isExpiry = true }: any) {
  const exp = isExpiry && isExp(value);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="date" name={name} value={value} onChange={onChange} required={required}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:ring-2 focus:outline-none transition-all ${exp && value ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-500/10 focus:border-red-400' : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/10'}`} />
      {exp && value && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500"><HiExclamationTriangle className="w-3.5 h-3.5" />Expired</p>}
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

export default function CreateDriverPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [idpRequired, setIdpRequired] = useState(false);

  const [form, setForm] = useState({
    driver_type: 'MAIN_CUSTOMER' as DriverTypeValue,
    full_name: '', phone_number: '', whatsapp_number: '', email: '',
    nationality: '', date_of_birth: '', address: '',
    driving_license_number: '', license_expiry_date: '', license_country: 'UAE',
    idp_number: '', idp_expiry: '',
    emirates_id: '', emirates_id_expiry: '',
    passport_number: '', passport_expiry: '',
    visa_number: '', visa_expiry: '',
    customer_id: '',
    // Document photos
    emirates_id_front_url: '', emirates_id_back_url: '',
    license_front_url: '', license_back_url: '',
    passport_photo_url: '', visa_photo_url: '',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const setPhoto = (key: string) => (url: string) =>
    setForm(p => ({ ...p, [key]: url }));

  const canNext = () => {
    if (step === 0) return !!form.driver_type;
    if (step === 1) return !!form.full_name.trim() && !!form.phone_number.trim();
    if (step === 2) return !!form.driving_license_number.trim() && !!form.license_expiry_date;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form, idp_required: idpRequired };
      if (!idpRequired) { delete payload.idp_number; delete payload.idp_expiry; }
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      await driverService.createDriver(payload as any);
      toast.success('Driver profile created');
      router.push('/drivers');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create driver'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = DRIVER_TYPES.find(t => t.value === form.driver_type)!;
  const SelectedTypeIcon = selectedType.icon;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/drivers')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Drivers
          </button>
          <span className="text-sm font-semibold text-gray-900">Add New Driver</span>
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
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-400'}`}>
                    {done ? <HiCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center leading-tight px-1 ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mt-[18px] mx-1 rounded-full" style={{ background: i < step ? '#2563EB' : '#E5E7EB' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
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

          {/* Body */}
          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Driver Type */}
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {DRIVER_TYPES.map(t => {
                  const active = form.driver_type === t.value;
                  const TIcon = t.icon;
                  return (
                    <button key={t.value} type="button"
                      onClick={() => setForm(p => ({ ...p, driver_type: t.value }))}
                      className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${active ? `${t.activeBorder} ${t.bg} shadow-sm` : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? t.iconBg : 'bg-gray-100'}`}>
                        <TIcon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm text-gray-900">{t.label}</p>
                          {active && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><HiCheck className="w-3 h-3 text-white" /></div>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — Basic Info */}
            {step === 1 && (
              <>
                <div>
                  <FG title="Personal" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><F label="Full Name" name="full_name" value={form.full_name} onChange={set} required placeholder="John Smith" /></div>
                    <S label="Nationality" name="nationality" value={form.nationality} onChange={set} options={COUNTRIES} placeholder="Select nationality" />
                    <D label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={set} isExpiry={false} />
                    <div className="col-span-2"><F label="Address" name="address" value={form.address} onChange={set} placeholder="Dubai, UAE" /></div>
                  </div>
                </div>
                <div>
                  <FG title="Contact" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Phone" name="phone_number" value={form.phone_number} onChange={set} required placeholder="+971 50 000 0000" />
                    <F label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} onChange={set} placeholder="+971 50 000 0000" />
                    <div className="col-span-2"><F label="Email" name="email" value={form.email} onChange={set} type="email" placeholder="driver@email.com" /></div>
                  </div>
                </div>
                <div>
                  <FG title="Link (Optional)" />
                  <F label="Linked Customer ID" name="customer_id" value={form.customer_id} onChange={set} placeholder="UUID of linked customer" />
                </div>
              </>
            )}

            {/* Step 3 — License */}
            {step === 2 && (
              <>
                <div>
                  <FG title="Driving License" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={set} required />
                    <D label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={set} required />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">License Country</label>
                      <div className="relative">
                        <select name="license_country" value={form.license_country} onChange={set}
                          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
                          {LICENSE_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    {form.license_expiry_date && (
                      <div className={`rounded-xl p-4 border flex items-center gap-3 ${isExp(form.license_expiry_date) ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isExp(form.license_expiry_date) ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">License Status</p>
                          <p className={`text-sm font-bold ${isExp(form.license_expiry_date) ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isExp(form.license_expiry_date) ? 'Expired' : 'Valid'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* IDP toggle */}
                <div className={`rounded-xl border p-5 transition-all ${idpRequired ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <button type="button" onClick={() => setIdpRequired(p => !p)} className="flex items-center gap-4 w-full text-left">
                    <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${idpRequired ? 'bg-amber-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${idpRequired ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">International Driving Permit (IDP)</p>
                      <p className="text-xs text-gray-500 mt-0.5">Required for some nationalities in UAE</p>
                    </div>
                  </button>
                  {idpRequired && (
                    <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-amber-200">
                      <F label="IDP Number" name="idp_number" value={form.idp_number} onChange={set} />
                      <D label="IDP Expiry" name="idp_expiry" value={form.idp_expiry} onChange={set} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 4 — ID Docs */}
            {step === 3 && (
              <>
                <div>
                  <FG title="Emirates ID" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={set} placeholder="784-XXXX-XXXXXXX-X" />
                    <D label="Emirates ID Expiry" name="emirates_id_expiry" value={form.emirates_id_expiry} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Passport & Visa" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Passport Number" name="passport_number" value={form.passport_number} onChange={set} />
                    <D label="Passport Expiry" name="passport_expiry" value={form.passport_expiry} onChange={set} />
                    <F label="Visa Number" name="visa_number" value={form.visa_number} onChange={set} />
                    <D label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={set} />
                  </div>
                </div>
                <div>
                  <FG title="Document Photos" />
                  <div className="grid grid-cols-2 gap-4">
                    <DocumentUpload label="Emirates ID — Front" category="driver-docs" docKey="EMIRATES_ID_FRONT" value={form.emirates_id_front_url} onChange={setPhoto('emirates_id_front_url')} />
                    <DocumentUpload label="Emirates ID — Back" category="driver-docs" docKey="EMIRATES_ID_BACK" value={form.emirates_id_back_url} onChange={setPhoto('emirates_id_back_url')} />
                    <DocumentUpload label="Driving License — Front" category="driver-docs" docKey="LICENSE_FRONT" value={form.license_front_url} onChange={setPhoto('license_front_url')} />
                    <DocumentUpload label="Driving License — Back" category="driver-docs" docKey="LICENSE_BACK" value={form.license_back_url} onChange={setPhoto('license_back_url')} />
                    <DocumentUpload label="Passport Photo" category="driver-docs" docKey="PASSPORT" value={form.passport_photo_url} onChange={setPhoto('passport_photo_url')} />
                    <DocumentUpload label="Visa Photo" category="driver-docs" docKey="VISA" value={form.visa_photo_url} onChange={setPhoto('visa_photo_url')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 5 — Review */}
            {step === 4 && (
              <>
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${selectedType.activeBorder} ${selectedType.bg}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedType.iconBg}`}>
                    <SelectedTypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedType.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedType.desc}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Personal</p>
                    <ReviewRow label="Name" value={form.full_name} />
                    <ReviewRow label="Phone" value={form.phone_number} />
                    <ReviewRow label="WhatsApp" value={form.whatsapp_number} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Nationality" value={form.nationality} />
                    <ReviewRow label="Date of Birth" value={form.date_of_birth} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">License</p>
                    <ReviewRow label="License No." value={form.driving_license_number} />
                    <ReviewRow label="Country" value={form.license_country} />
                    <ReviewRow label="Expiry" value={form.license_expiry_date} />
                    {idpRequired && <ReviewRow label="IDP Number" value={form.idp_number} />}
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 mb-3">License Status</p>
                    <div className={`flex items-center gap-2 text-sm font-semibold ${isExp(form.license_expiry_date) ? 'text-red-600' : 'text-emerald-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${isExp(form.license_expiry_date) ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      {form.license_expiry_date ? (isExp(form.license_expiry_date) ? 'Expired' : 'Valid') : 'Not entered'}
                    </div>
                  </div>
                  {(form.emirates_id || form.passport_number || form.visa_number) && (
                    <div className="sm:col-span-2 bg-gray-50 rounded-xl p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Identity Documents</p>
                      <div className="grid sm:grid-cols-2 gap-x-8">
                        <div>
                          <ReviewRow label="Emirates ID" value={form.emirates_id} />
                          <ReviewRow label="ID Expiry" value={form.emirates_id_expiry} />
                        </div>
                        <div>
                          <ReviewRow label="Passport" value={form.passport_number} />
                          <ReviewRow label="Passport Expiry" value={form.passport_expiry} />
                          <ReviewRow label="Visa" value={form.visa_number} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(!form.full_name || !form.phone_number || !form.driving_license_number) && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    <HiExclamationTriangle className="w-5 h-5 flex-shrink-0" />
                    Required fields missing — go back and complete Name, Phone and License Number.
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
              <button onClick={handleSubmit}
                disabled={submitting || !form.full_name || !form.phone_number || !form.driving_license_number}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><HiCheck className="w-4 h-4" />Create Driver</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
