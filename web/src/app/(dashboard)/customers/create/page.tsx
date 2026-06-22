'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customerService } from '@/services/customer.service';
import toast from 'react-hot-toast';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';
import { COUNTRIES } from '@/lib/countries';
import { DocumentUpload } from '@/components/DocumentUpload';
import {
  HiCheck, HiChevronLeft, HiChevronRight, HiChevronDown,
  HiUser, HiPhone, HiDocumentText, HiClipboardDocumentCheck,
  HiGlobeAlt, HiOutlineBuildingOffice2, HiBuildingOffice2,
  HiExclamationTriangle,
} from 'react-icons/hi2';

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const CUSTOMER_TYPES = [
  { value: 'UAE_RESIDENT', label: 'UAE Resident',  desc: 'Individual living in UAE',    docs: 'Emirates ID · Driving License',         icon: HiUser,                   bg: 'bg-blue-50',   border: 'border-blue-200', activeBorder: 'border-blue-500', iconBg: 'bg-blue-600' },
  { value: 'TOURIST',      label: 'Tourist',        desc: 'Visitor from abroad',         docs: 'Passport · Visa · License',              icon: HiGlobeAlt,               bg: 'bg-teal-50',   border: 'border-teal-200', activeBorder: 'border-teal-500', iconBg: 'bg-teal-600' },
  { value: 'COMPANY',      label: 'Company',        desc: 'Business account',            docs: 'Trade License · TRN / VAT',              icon: HiOutlineBuildingOffice2, bg: 'bg-orange-50', border: 'border-orange-200', activeBorder: 'border-orange-500', iconBg: 'bg-orange-600' },
  { value: 'CORPORATE',    label: 'Corporate',      desc: 'Large account with credit',   docs: 'Corporate Agreement · Credit Terms',    icon: HiBuildingOffice2,        bg: 'bg-purple-50', border: 'border-purple-200', activeBorder: 'border-purple-500', iconBg: 'bg-purple-600' },
] as const;

type CustomerType = 'UAE_RESIDENT' | 'TOURIST' | 'COMPANY' | 'CORPORATE';

const STEPS = [
  { label: 'Type',     icon: HiUser,                   desc: 'Select customer category' },
  { label: 'Contact',  icon: HiPhone,                  desc: 'Name, phone & email' },
  { label: 'Documents', icon: HiDocumentText,          desc: 'ID & expiry dates' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & create' },
];

const isExp = (d?: string) => !!d && new Date(d) < new Date();

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function F({ label, name, value, onChange, type = 'text', required = false, placeholder = '', dir }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} dir={dir}
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

export default function CreateCustomerPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_type: 'UAE_RESIDENT' as CustomerType,
    full_name_en: '', full_name_ar: '', phone_number: '', whatsapp_number: '', email: '',
    nationality: '', date_of_birth: '',
    emirates_id: '', id_expiry_date: '', driving_license_number: '', license_expiry_date: '',
    address_line_1: '', city: '', emirate: '',
    passport_number: '', passport_expiry: '', visa_number: '', visa_expiry: '',
    hotel_name: '', arrival_date: '', departure_date: '',
    company_name: '', trade_license_number: '', trade_license_expiry: '',
    trn_number: '', authorized_person_name: '', authorized_person_mobile: '',
    payment_terms: 'CASH', credit_limit: '',
    // Document photos
    emirates_id_front_url: '', emirates_id_back_url: '',
    license_front_url: '', license_back_url: '',
    passport_photo_url: '', visa_photo_url: '',
  });

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const setPhoto = (key: string) => (url: string) =>
    setForm(p => ({ ...p, [key]: url }));

  const isCompany = form.customer_type === 'COMPANY' || form.customer_type === 'CORPORATE';
  const typeInfo = CUSTOMER_TYPES.find(t => t.value === form.customer_type)!;
  const TypeIcon = typeInfo.icon;

  const canNext = () => {
    if (step === 0) return !!form.customer_type;
    if (step === 1) return !!form.full_name_en.trim() && !!form.phone_number.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await customerService.createCustomer(cleanPayload(form) as any);
      toast.success('Customer created');
      router.push('/customers');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create customer'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/customers')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Customers
          </button>
          <span className="text-sm font-semibold text-gray-900">Add New Customer</span>
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

          {/* Header */}
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

            {/* Step 1 — Type */}
            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {CUSTOMER_TYPES.map(t => {
                  const active = form.customer_type === t.value;
                  const TIcon = t.icon;
                  return (
                    <button key={t.value} type="button"
                      onClick={() => setForm(p => ({ ...p, customer_type: t.value as CustomerType }))}
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
                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">{t.docs}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — Contact */}
            {step === 1 && (
              <>
                <div>
                  <FG title={isCompany ? 'Company' : 'Personal'} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <F label={isCompany ? 'Company / Account Name' : 'Full Name (English)'} name="full_name_en" value={form.full_name_en} onChange={set} required placeholder={isCompany ? 'Company LLC' : 'John Smith'} />
                    </div>
                    {!isCompany && <>
                      <div className="col-span-2">
                        <F label="Full Name (Arabic)" name="full_name_ar" value={form.full_name_ar} onChange={set} placeholder="الاسم بالعربي" dir="rtl" />
                      </div>
                      <S label="Nationality" name="nationality" value={form.nationality} onChange={set} options={COUNTRIES} placeholder="Select nationality" />
                      <D label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={set} isExpiry={false} />
                    </>}
                  </div>
                </div>
                <div>
                  <FG title="Contact" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Phone Number" name="phone_number" value={form.phone_number} onChange={set} required placeholder="+971 50 000 0000" />
                    <F label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} onChange={set} placeholder="+971 50 000 0000" />
                    <div className="col-span-2">
                      <F label="Email" name="email" value={form.email} onChange={set} type="email" placeholder="email@example.com" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Documents */}
            {step === 2 && (
              <>
                {form.customer_type === 'UAE_RESIDENT' && (
                  <>
                    <div>
                      <FG title="Emirates ID" />
                      <div className="grid grid-cols-2 gap-4">
                        <F label="Emirates ID Number" name="emirates_id" value={form.emirates_id} onChange={set} placeholder="784-XXXX-XXXXXXX-X" />
                        <D label="ID Expiry" name="id_expiry_date" value={form.id_expiry_date} onChange={set} />
                      </div>
                    </div>
                    <div>
                      <FG title="Driving License" />
                      <div className="grid grid-cols-2 gap-4">
                        <F label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={set} required />
                        <D label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={set} required />
                      </div>
                    </div>
                    <div>
                      <FG title="Document Photos" />
                      <div className="grid grid-cols-2 gap-4">
                        <DocumentUpload label="Emirates ID — Front" category="customer-docs" docKey="EMIRATES_ID_FRONT" value={form.emirates_id_front_url} onChange={setPhoto('emirates_id_front_url')} />
                        <DocumentUpload label="Emirates ID — Back" category="customer-docs" docKey="EMIRATES_ID_BACK" value={form.emirates_id_back_url} onChange={setPhoto('emirates_id_back_url')} />
                        <DocumentUpload label="Driving License — Front" category="customer-docs" docKey="LICENSE_FRONT" value={form.license_front_url} onChange={setPhoto('license_front_url')} />
                        <DocumentUpload label="Driving License — Back" category="customer-docs" docKey="LICENSE_BACK" value={form.license_back_url} onChange={setPhoto('license_back_url')} />
                      </div>
                    </div>
                    <div>
                      <FG title="Address" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><F label="Address Line" name="address_line_1" value={form.address_line_1} onChange={set} placeholder="Street, Building" /></div>
                        <F label="City" name="city" value={form.city} onChange={set} />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Emirate</label>
                          <div className="relative">
                            <select name="emirate" value={form.emirate} onChange={set}
                              className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
                              <option value="">Select</option>
                              {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {form.customer_type === 'TOURIST' && (
                  <>
                    <div>
                      <FG title="Passport & Visa" />
                      <div className="grid grid-cols-2 gap-4">
                        <F label="Passport Number" name="passport_number" value={form.passport_number} onChange={set} required />
                        <D label="Passport Expiry" name="passport_expiry" value={form.passport_expiry} onChange={set} required />
                        <F label="Visa / Entry No." name="visa_number" value={form.visa_number} onChange={set} required />
                        <D label="Visa Expiry" name="visa_expiry" value={form.visa_expiry} onChange={set} required />
                      </div>
                    </div>
                    <div>
                      <FG title="Driving License" />
                      <div className="grid grid-cols-2 gap-4">
                        <F label="License Number" name="driving_license_number" value={form.driving_license_number} onChange={set} required />
                        <D label="License Expiry" name="license_expiry_date" value={form.license_expiry_date} onChange={set} required />
                      </div>
                    </div>
                    <div>
                      <FG title="Document Photos" />
                      <div className="grid grid-cols-2 gap-4">
                        <DocumentUpload label="Passport Photo" category="customer-docs" docKey="PASSPORT" value={form.passport_photo_url} onChange={setPhoto('passport_photo_url')} />
                        <DocumentUpload label="Tourist Visa" category="customer-docs" docKey="VISA" value={form.visa_photo_url} onChange={setPhoto('visa_photo_url')} />
                        <DocumentUpload label="Driving License — Front" category="customer-docs" docKey="LICENSE_FRONT" value={form.license_front_url} onChange={setPhoto('license_front_url')} />
                        <DocumentUpload label="Driving License — Back" category="customer-docs" docKey="LICENSE_BACK" value={form.license_back_url} onChange={setPhoto('license_back_url')} />
                      </div>
                    </div>
                    <div>
                      <FG title="Stay Details" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><F label="Hotel / Stay" name="hotel_name" value={form.hotel_name} onChange={set} /></div>
                        <D label="Arrival Date" name="arrival_date" value={form.arrival_date} onChange={set} isExpiry={false} />
                        <D label="Departure Date" name="departure_date" value={form.departure_date} onChange={set} isExpiry={false} />
                      </div>
                    </div>
                  </>
                )}

                {isCompany && (
                  <>
                    <div>
                      <FG title="Company Documents" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><F label="Registered Company Name" name="company_name" value={form.company_name} onChange={set} required /></div>
                        <F label="Trade License No." name="trade_license_number" value={form.trade_license_number} onChange={set} required />
                        <D label="Trade License Expiry" name="trade_license_expiry" value={form.trade_license_expiry} onChange={set} required />
                        <div className="col-span-2"><F label="TRN / VAT Number" name="trn_number" value={form.trn_number} onChange={set} /></div>
                      </div>
                    </div>
                    <div>
                      <FG title="Contact Person" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><F label="Authorized Person Name" name="authorized_person_name" value={form.authorized_person_name} onChange={set} /></div>
                        <F label="Mobile" name="authorized_person_mobile" value={form.authorized_person_mobile} onChange={set} />
                        <F label="Company Email" name="email" value={form.email} onChange={set} type="email" />
                      </div>
                    </div>
                    <div>
                      <FG title="Credit Terms" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms</label>
                          <div className="relative">
                            <select name="payment_terms" value={form.payment_terms} onChange={set}
                              className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
                              <option value="CASH">Cash</option>
                              <option value="NET_30">Net 30</option>
                              <option value="NET_60">Net 60</option>
                              <option value="MONTHLY">Monthly Invoice</option>
                            </select>
                            <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <F label="Credit Limit (AED)" name="credit_limit" value={form.credit_limit} onChange={set} type="number" placeholder="0" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${typeInfo.activeBorder} ${typeInfo.bg}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeInfo.iconBg}`}>
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{typeInfo.label} Account</p>
                    <p className="text-xs text-gray-500">{typeInfo.docs}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contact</p>
                    <ReviewRow label="Name" value={form.full_name_en} />
                    <ReviewRow label="Phone" value={form.phone_number} />
                    <ReviewRow label="WhatsApp" value={form.whatsapp_number} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Nationality" value={form.nationality} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Documents</p>
                    {form.customer_type === 'UAE_RESIDENT' && <>
                      <ReviewRow label="Emirates ID" value={form.emirates_id} />
                      <ReviewRow label="ID Expiry" value={form.id_expiry_date} />
                      <ReviewRow label="License" value={form.driving_license_number} />
                      <ReviewRow label="Lic. Expiry" value={form.license_expiry_date} />
                    </>}
                    {form.customer_type === 'TOURIST' && <>
                      <ReviewRow label="Passport" value={form.passport_number} />
                      <ReviewRow label="Passport Exp." value={form.passport_expiry} />
                      <ReviewRow label="Visa" value={form.visa_number} />
                      <ReviewRow label="License" value={form.driving_license_number} />
                    </>}
                    {isCompany && <>
                      <ReviewRow label="Company" value={form.company_name} />
                      <ReviewRow label="Trade License" value={form.trade_license_number} />
                      <ReviewRow label="TRN" value={form.trn_number} />
                      <ReviewRow label="Payment Terms" value={form.payment_terms} />
                    </>}
                  </div>
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
              <button onClick={handleSubmit} disabled={submitting || !form.full_name_en || !form.phone_number}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <><HiCheck className="w-4 h-4" />Create Customer</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
