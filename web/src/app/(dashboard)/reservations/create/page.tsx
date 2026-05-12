'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineUser, HiOutlineTruck, HiOutlineCalendarDays,
  HiClipboardDocumentCheck, HiMagnifyingGlass, HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { reservationService } from '@/services/reservation.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';
import { vehicleCategoryService } from '@/services/vehicle-category.service';
import { branchService } from '@/services/branch.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STEPS = [
  { label: 'Customer', icon: HiOutlineUser,            desc: 'Find the customer' },
  { label: 'Vehicle',  icon: HiOutlineTruck,           desc: 'Select vehicle or category' },
  { label: 'Dates',    icon: HiOutlineCalendarDays,    desc: 'Pickup, return & branch' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & create' },
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

export default function CreateReservationPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — Customer
  const [customerSearch, setCustomerSearch]     = useState('');
  const [customerResults, setCustomerResults]   = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Step 2 — Vehicle / Category
  const [vehicles, setVehicles]               = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch]     = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [categories, setCategories]           = useState<any[]>([]);
  const [catSearch, setCatSearch]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Step 3 — Dates & Branch
  const [pickupDatetime, setPickupDatetime] = useState('');
  const [returnDatetime, setReturnDatetime] = useState('');
  const [branchId, setBranchId]             = useState('');
  const [notes, setNotes]                   = useState('');
  const [branches, setBranches]             = useState<any[]>([]);

  // Load vehicles, categories, branches once
  useEffect(() => {
    vehicleService.getVehicles({ limit: 200 })
      .then(d => setVehicles(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => {});
    vehicleCategoryService.listVehicleCategories()
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    branchService.listBranches()
      .then(d => setBranches(Array.isArray(d) ? d : (d?.data ?? [])))
      .catch(() => {});
  }, []);

  // Customer search debounce
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await customerService.searchCustomers(customerSearch);
        setCustomerResults(Array.isArray(res) ? res : []);
      } catch { setCustomerResults([]); }
      finally { setLoadingCustomers(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      (v.plate_number ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q)
    );
  });

  const filteredCats = categories.filter(c =>
    !catSearch.trim() || (c.category_name ?? '').toLowerCase().includes(catSearch.toLowerCase())
  );

  const canNext = () => {
    if (step === 0) return !!selectedCustomer;
    if (step === 1) return !!selectedVehicle || !!selectedCategory;
    if (step === 2) return !!pickupDatetime && !!returnDatetime;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reservationService.createReservation(cleanPayload({
        customer_id:         selectedCustomer.id,
        vehicle_id:          selectedVehicle?.id,
        vehicle_category_id: selectedCategory?.id,
        pickup_datetime:     pickupDatetime,
        return_datetime:     returnDatetime,
        branch_id:           branchId || undefined,
        notes:               notes.trim() || undefined,
      }));
      toast.success('Reservation created');
      router.push('/reservations');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create reservation'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBranch = branches.find(b => b.id === branchId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/reservations')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Reservations
          </button>
          <span className="text-sm font-semibold text-gray-900">New Reservation</span>
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

            {/* Step 1 — Customer */}
            {step === 0 && (
              <div>
                <FG title="Search Customer" />
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="text" value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  {(loadingCustomers || customerResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {loadingCustomers
                        ? <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
                        : customerResults.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.full_name_en ?? c.phone_number); setCustomerResults([]); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50/60 text-sm">
                            <span className="font-medium text-gray-900">{c.full_name_en}</span>
                            <span className="text-xs text-gray-400">{c.phone_number}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <HiOutlineUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedCustomer.full_name_en}</p>
                      <p className="text-sm text-blue-700">{selectedCustomer.phone_number}</p>
                    </div>
                    <HiCheck className="w-5 h-5 text-blue-600 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Vehicle / Category */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Specific vehicle */}
                <div>
                  <FG title="Specific Vehicle (optional)" />
                  <div className="relative mb-2">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={vehicleSearch}
                      onChange={e => { setVehicleSearch(e.target.value); setSelectedVehicle(null); }}
                      placeholder="Search by plate, make or model..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  {vehicleSearch.trim() && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {filteredVehicles.length === 0
                        ? <p className="px-4 py-3 text-sm text-gray-400">No vehicles match</p>
                        : filteredVehicles.map(v => (
                          <button key={v.id} type="button"
                            onClick={() => { setSelectedVehicle(v); setVehicleSearch(`${v.make} ${v.model} — ${v.plate_number}`); }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm border-b last:border-0 border-gray-50 hover:bg-blue-50/60 ${selectedVehicle?.id === v.id ? 'bg-blue-50' : ''}`}>
                            <div>
                              <span className="font-medium text-gray-900">{v.make} {v.model}</span>
                              <span className="text-gray-400 ml-1">({v.year})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {v.status}
                              </span>
                              <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{v.plate_number}</span>
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                  {selectedVehicle && !vehicleSearch.includes('—') === false && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                      <HiCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{selectedVehicle.make} {selectedVehicle.model} — {selectedVehicle.plate_number}</span>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <FG title="Vehicle Category (optional)" />
                  <div className="relative mb-2">
                    <HiOutlineSquares2X2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={catSearch}
                      onChange={e => { setCatSearch(e.target.value); setSelectedCategory(null); }}
                      placeholder="Search category..."
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    {filteredCats.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedCategory(c); setCatSearch(c.category_name); }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                          selectedCategory?.id === c.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className="font-semibold text-gray-900 text-sm">{c.category_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.category_code}</span>
                          {selectedCategory?.id === c.id && <HiCheck className="w-4 h-4 text-blue-600" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {!selectedVehicle && !selectedCategory && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Select at least a vehicle or a category to continue.
                  </p>
                )}
              </div>
            )}

            {/* Step 3 — Dates & Branch */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <FG title="Rental Period" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Pickup Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" value={pickupDatetime}
                        onChange={e => setPickupDatetime(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Return Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" value={returnDatetime}
                        onChange={e => setReturnDatetime(e.target.value)}
                        min={pickupDatetime}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <FG title="Branch & Notes" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch (optional)</label>
                      <select value={branchId} onChange={e => setBranchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all bg-white">
                        <option value="">No specific branch</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Any special requests or notes..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <HiOutlineCalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedCustomer?.full_name_en}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer?.phone_number}</p>
                  </div>
                  {pickupDatetime && returnDatetime && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="font-bold text-gray-900">
                        {Math.ceil((new Date(returnDatetime).getTime() - new Date(pickupDatetime).getTime()) / 86400000)} days
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Customer"   value={selectedCustomer?.full_name_en} />
                  <ReviewRow label="Phone"      value={selectedCustomer?.phone_number} />
                  <ReviewRow label="Vehicle"    value={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} — ${selectedVehicle.plate_number}` : undefined} />
                  <ReviewRow label="Category"   value={selectedCategory?.category_name} />
                  <ReviewRow label="Pickup"     value={pickupDatetime ? new Date(pickupDatetime).toLocaleString() : undefined} />
                  <ReviewRow label="Return"     value={returnDatetime ? new Date(returnDatetime).toLocaleString() : undefined} />
                  <ReviewRow label="Branch"     value={selectedBranch?.branch_name} />
                  <ReviewRow label="Notes"      value={notes || undefined} />
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
                  : <><HiCheck className="w-4 h-4" />Create Reservation</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
