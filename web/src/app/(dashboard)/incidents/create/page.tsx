'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineTruck, HiOutlineUser, HiOutlineDocumentText, HiClipboardDocumentCheck,
  HiMagnifyingGlass, HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { incidentService } from '@/services/incident.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';
import { getAgreements } from '@/services/agreement.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const TYPE_OPTIONS = ['ACCIDENT', 'THEFT', 'VANDALISM', 'FIRE', 'FLOOD', 'OTHER'];

const STEPS = [
  { label: 'Vehicle',  icon: HiOutlineTruck,          desc: 'Select the vehicle involved' },
  { label: 'Customer', icon: HiOutlineUser,            desc: 'Customer & agreement details' },
  { label: 'Incident', icon: HiOutlineExclamationTriangle, desc: 'Type, time & description' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & report' },
];

const emptyForm = {
  vehicle_id: '', customer_id: '', agreement_id: '',
  incident_type: 'ACCIDENT', description: '', location: '', incident_datetime: '',
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
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
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

function SearchBox({ label, value, onChange, onSelect, onFocus, showDrop, dropRef, results, renderItem, selectedLabel, required = false, placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative" ref={dropRef}>
        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input type="text" value={value} onChange={onChange} onFocus={onFocus} placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        {showDrop && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {results.map(renderItem)}
          </div>
        )}
      </div>
      {selectedLabel && (
        <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
          <HiCheck className="w-3.5 h-3.5" /> {selectedLabel}
        </p>
      )}
    </div>
  );
}

export default function CreateIncidentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleDrop, setShowVehicleDrop] = useState(false);
  const vehicleRef = useRef<HTMLDivElement>(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  const [allAgreements, setAllAgreements] = useState<any[]>([]);
  const [agreementSearch, setAgreementSearch] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [showAgreementDrop, setShowAgreementDrop] = useState(false);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    vehicleService.getVehicles({ limit: 200 })
      .then(d => setAllVehicles(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {});
    getAgreements({ limit: 100 })
      .then(d => setAllAgreements(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await customerService.searchCustomers(customerSearch);
        setCustomers(Array.isArray(res) ? res : (res?.data || []));
      } catch { setCustomers([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) setShowVehicleDrop(false);
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerDrop(false);
      if (agreementRef.current && !agreementRef.current.contains(e.target as Node)) setShowAgreementDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredVehicles = allVehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase();
    return (v.plate_number ?? '').toLowerCase().includes(q) || (v.make ?? '').toLowerCase().includes(q) || (v.model ?? '').toLowerCase().includes(q);
  }).slice(0, 8);

  const filteredAgreements = allAgreements.filter(a => {
    if (!agreementSearch.trim()) return true;
    const q = agreementSearch.toLowerCase();
    return (a.agreement_number ?? '').toLowerCase().includes(q) || (a.customer_name ?? '').toLowerCase().includes(q) || (a.plate_number ?? '').toLowerCase().includes(q);
  }).slice(0, 8);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const canNext = () => {
    if (step === 0) return !!form.vehicle_id;
    if (step === 1) return !!form.customer_id && !!form.agreement_id;
    if (step === 2) return !!form.description.trim() && !!form.incident_datetime;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await incidentService.createIncident(cleanPayload(form));
      toast.success('Incident reported');
      router.push('/incidents');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to report incident'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/incidents')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Incidents
          </button>
          <span className="text-sm font-semibold text-gray-900">Report Incident</span>
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return (
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Vehicle */}
            {step === 0 && (
              <div className="space-y-4">
                <FG title="Select Vehicle" />
                <SearchBox
                  label="Vehicle" required placeholder="Search by plate, make or model..."
                  value={vehicleSearch}
                  onChange={(e: any) => { setVehicleSearch(e.target.value); setShowVehicleDrop(true); if (!selectedVehicle) setForm(f => ({ ...f, vehicle_id: '' })); }}
                  onFocus={() => setShowVehicleDrop(true)}
                  showDrop={showVehicleDrop} dropRef={vehicleRef}
                  results={filteredVehicles}
                  selectedLabel={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number}` : ''}
                  renderItem={(v: any) => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setVehicleSearch(`${v.plate_number} — ${v.make} ${v.model}`); setForm(f => ({ ...f, vehicle_id: v.id })); setShowVehicleDrop(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50/60 text-sm">
                      <span className="font-medium text-gray-900">{v.make} {v.model} <span className="text-gray-400 font-normal">({v.year})</span></span>
                      <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{v.plate_number}</span>
                    </button>
                  )}
                />
                {selectedVehicle && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                      <HiOutlineTruck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</p>
                      <p className="text-sm text-red-700 font-mono">{selectedVehicle.plate_number}</p>
                    </div>
                    <HiCheck className="w-5 h-5 text-red-600 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Customer */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <FG title="Customer" />
                  <SearchBox
                    label="Customer" required placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e: any) => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); setSelectedCustomer(null); setForm(f => ({ ...f, customer_id: '' })); }}
                    onFocus={() => setShowCustomerDrop(true)}
                    showDrop={showCustomerDrop} dropRef={customerRef}
                    results={customers}
                    selectedLabel={selectedCustomer ? (selectedCustomer.full_name_en ?? selectedCustomer.full_name) : ''}
                    renderItem={(c: any) => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.full_name_en ?? c.full_name ?? ''); setForm(f => ({ ...f, customer_id: c.id })); setShowCustomerDrop(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/60 text-sm">
                        <HiOutlineUser className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{c.full_name_en ?? c.full_name}</p>
                          <p className="text-xs text-gray-500">{c.phone_number ?? c.email ?? ''}</p>
                        </div>
                      </button>
                    )}
                  />
                </div>
                <div>
                  <FG title="Agreement" />
                  <SearchBox
                    label="Agreement" required placeholder="Search by agreement number or plate..."
                    value={agreementSearch}
                    onChange={(e: any) => { setAgreementSearch(e.target.value); setShowAgreementDrop(true); setSelectedAgreement(null); setForm(f => ({ ...f, agreement_id: '' })); }}
                    onFocus={() => setShowAgreementDrop(true)}
                    showDrop={showAgreementDrop} dropRef={agreementRef}
                    results={filteredAgreements}
                    selectedLabel={selectedAgreement ? (selectedAgreement.agreement_number ?? selectedAgreement.id?.slice(0, 8)) : ''}
                    renderItem={(a: any) => (
                      <button key={a.id} type="button"
                        onClick={() => { setSelectedAgreement(a); setAgreementSearch(a.agreement_number ?? a.id.slice(0, 8)); setForm(f => ({ ...f, agreement_id: a.id })); setShowAgreementDrop(false); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50/60 text-sm">
                        <span className="font-mono text-xs font-medium text-gray-900">{a.agreement_number ?? a.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500">{a.customer_name ?? ''} {a.plate_number ? `· ${a.plate_number}` : ''}</span>
                      </button>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Incident */}
            {step === 2 && (
              <>
                <div>
                  <FG title="Incident Type" />
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TYPE_OPTIONS.map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(p => ({ ...p, incident_type: t }))}
                        className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold text-center transition-all ${
                          form.incident_type === t
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FG title="Details" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <F label="Incident Date & Time" name="incident_datetime" value={form.incident_datetime} onChange={set} type="datetime-local" required />
                      </div>
                      <div className="col-span-2">
                        <F label="Location" name="location" value={form.location} onChange={set} placeholder="e.g. Sheikh Zayed Rd, Dubai" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea name="description" value={form.description} onChange={set} rows={4}
                        placeholder="Describe what happened..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-red-400 bg-red-50">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{form.incident_type} Incident</p>
                    <p className="text-xs text-gray-500">{form.incident_datetime ? new Date(form.incident_datetime).toLocaleString() : ''}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Parties</p>
                    <ReviewRow label="Vehicle" value={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number}` : undefined} />
                    <ReviewRow label="Customer" value={selectedCustomer ? (selectedCustomer.full_name_en ?? selectedCustomer.full_name) : undefined} />
                    <ReviewRow label="Agreement" value={selectedAgreement ? (selectedAgreement.agreement_number ?? selectedAgreement.id?.slice(0, 8)) : undefined} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Incident</p>
                    <ReviewRow label="Type" value={form.incident_type} />
                    <ReviewRow label="Location" value={form.location} />
                    <ReviewRow label="Description" value={form.description} />
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
              <button onClick={handleSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Reporting...</>
                  : <><HiCheck className="w-4 h-4" />Report Incident</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
