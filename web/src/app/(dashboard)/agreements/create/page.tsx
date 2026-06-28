'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
  HiXMark,
  HiUser,
  HiTruck,
  HiCalendarDays,
  HiCurrencyDollar,
  HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { SearchInput } from '@/components/SearchInput';
import { cleanPayload, sanitizeUuidFields, UUID_REGEX } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';
import type { Customer, Vehicle } from '@/types';
import type { CreateAgreementPayload } from '@/services/agreement.service';

const STEPS = [
  { label: 'Customer', icon: HiUser },
  { label: 'Vehicle', icon: HiTruck },
  { label: 'Dates', icon: HiCalendarDays },
  { label: 'Pricing', icon: HiCurrencyDollar },
  { label: 'Review', icon: HiClipboardDocumentCheck },
];

interface Pricing {
  days: number;
  months: number;
  weeks: number;
  remainder: number;
  amount: number;
  tier: 'daily' | 'weekly' | 'monthly' | 'none';
}

function calculateAmount(
  startDate: string,
  endDate: string,
  dailyRate: number,
  weeklyRate: number,
  monthlyRate: number
): Pricing {
  const empty: Pricing = { days: 0, months: 0, weeks: 0, remainder: 0, amount: 0, tier: 'none' };
  if (!startDate || !endDate) return empty;
  // datetime-local produces YYYY-MM-DDTHH:mm — ensure full ISO by appending :00
  const ensureSeconds = (s: string) => {
    if (!s) return '';
    const parts = s.split(':');
    if (parts.length >= 3) return s; // already has seconds
    return s + ':00';
  };
  const start = new Date(ensureSeconds(startDate)).getTime();
  const end = new Date(ensureSeconds(endDate)).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return empty;

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((end - start) / msPerDay));

  let amount = 0;
  let remaining = days;
  let months = 0;
  let weeks = 0;
  let tier: Pricing['tier'] = 'daily';

  // Tiered pricing: monthly (>=30d) → weekly (>=7d) → daily for the leftover.
  if (monthlyRate > 0 && remaining >= 30) {
    months = Math.floor(remaining / 30);
    amount += months * monthlyRate;
    remaining %= 30;
    tier = 'monthly';
  }
  if (weeklyRate > 0 && remaining >= 7) {
    weeks = Math.floor(remaining / 7);
    amount += weeks * weeklyRate;
    remaining %= 7;
    if (tier !== 'monthly') tier = 'weekly';
  }
  if (remaining > 0) {
    const perDay = dailyRate || (weeklyRate ? weeklyRate / 7 : monthlyRate / 30);
    amount += remaining * perDay;
  }

  return { days, months, weeks, remainder: remaining, amount, tier };
}

export default function CreateAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Step 2: Vehicle
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Step 3: Dates
  const [rentalStartDatetime, setRentalStartDatetime] = useState('');
  const [rentalEndDatetime, setRentalEndDatetime] = useState('');

  // Step 4: Rates
  const [dailyRate, setDailyRate] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [kmPerDay, setKmPerDay] = useState(0);
  const [extraKmRate, setExtraKmRate] = useState(0);

  // Step 4b: Contract charges & deposit
  const [charges, setCharges] = useState({
    deposit_amount: 0,
    cdw_amount: 0,
    excess_insurance_amount: 0,
    delivery_charges: 0,
    pickup_charges: 0,
    salik_charges: 0,
    fines_charges: 0,
    damages_charges: 0,
    fuel_charges: 0,
    extra_hour_charges: 0,
    other_charges: 0,
    deposit_waiver_amount: 0,
  });
  const setCharge = (key: keyof typeof charges, val: number) =>
    setCharges((c) => ({ ...c, [key]: val }));
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // Step 4c: Additional driver (optional)
  const [addDriver, setAddDriver] = useState({
    additional_driver_name: '',
    additional_driver_license: '',
    additional_driver_license_expiry: '',
    additional_driver_eid: '',
    additional_driver_dob: '',
  });
  const setAddDriverField = (key: keyof typeof addDriver, val: string) =>
    setAddDriver((d) => ({ ...d, [key]: val }));

  const pricing = useMemo(
    () => calculateAmount(rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate, monthlyRate),
    [rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate, monthlyRate]
  );

  // Sum of all positive contract charges (everything except deposit waiver).
  const chargesTotal = useMemo(() => {
    const { deposit_waiver_amount, ...rest } = charges;
    return Object.values(rest).reduce((s, v) => s + (Number(v) || 0), 0);
  }, [charges]);

  // Grand total as shown on the printed contract: rent + charges + deposit − waiver.
  const contractTotal = useMemo(
    () => pricing.amount + chargesTotal - (Number(charges.deposit_waiver_amount) || 0),
    [pricing.amount, chargesTotal, charges.deposit_waiver_amount]
  );

  // Prefill from a reservation (Convert to Agreement) via query params
  useEffect(() => {
    const customerId = searchParams.get('customer_id');
    const vehicleId = searchParams.get('vehicle_id');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const resId = searchParams.get('reservation_id');
    if (resId) setReservationId(resId);
    if (start) setRentalStartDatetime(start);
    if (end) setRentalEndDatetime(end);
    (async () => {
      try {
        if (customerId) {
          const c = await customerService.getCustomerById(customerId);
          if (c?.id) setSelectedCustomer(c);
        }
        if (vehicleId) {
          const v = await vehicleService.getVehicleById(vehicleId);
          if (v?.id) setSelectedVehicle(v);
        }
      } catch {
        /* prefill is best-effort */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search customers
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setLoadingCustomers(true);
        const res = await customerService.searchCustomers(customerSearch);
        const items = Array.isArray(res) ? res : (res?.data || []);
        setCustomers(items);
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to search customers'));
      } finally {
        setLoadingCustomers(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Search vehicles — no debounce on initial empty load, 400ms debounce while typing
  useEffect(() => {
    const delay = vehicleSearch.trim() ? 400 : 0;
    setLoadingVehicles(true);
    const timeout = setTimeout(async () => {
      try {
        const params: Record<string, any> = { limit: 20, status: 'AVAILABLE' };
        if (vehicleSearch.trim()) params.search = vehicleSearch;
        const res = await vehicleService.getVehicles(params);
        const items = Array.isArray(res) ? res : (res?.data || []);
        setVehicles(items);
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to search vehicles'));
      } finally {
        setLoadingVehicles(false);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [vehicleSearch]);

  // Auto-fill rates when vehicle selected
  useEffect(() => {
    if (selectedVehicle) {
      const v = selectedVehicle as any;
      setDailyRate(Number(v.daily_rate) || 0);
      setWeeklyRate(Number(v.weekly_rate) || 0);
      setMonthlyRate(Number(v.monthly_rate) || 0);
      setKmPerDay(Number(v.km_allowance_per_day) || 0);
      setExtraKmRate(Number(v.rate_per_extra_km) || 0);
    }
  }, [selectedVehicle]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return selectedCustomer !== null;
      case 1:
        return selectedVehicle !== null;
      case 2:
        return !!rentalStartDatetime && !!rentalEndDatetime && new Date(rentalEndDatetime) > new Date(rentalStartDatetime);
      case 3:
        return (dailyRate > 0 || weeklyRate > 0 || monthlyRate > 0) && pricing.amount > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedVehicle) return;
    try {
      setSubmitting(true);
      const rawPayload = {
        customer_id: selectedCustomer!.id,
        vehicle_id: selectedVehicle!.id,
        reservation_id: reservationId || undefined,
        rental_start_datetime: rentalStartDatetime,
        rental_end_datetime: rentalEndDatetime,
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate || undefined,
        km_allowance_per_day: kmPerDay || undefined,
        rate_per_extra_km: extraKmRate || undefined,
        estimated_amount: pricing.amount,
        // Contract charges & deposit
        deposit_amount: charges.deposit_amount || undefined,
        cdw_amount: charges.cdw_amount || undefined,
        excess_insurance_amount: charges.excess_insurance_amount || undefined,
        delivery_charges: charges.delivery_charges || undefined,
        pickup_charges: charges.pickup_charges || undefined,
        salik_charges: charges.salik_charges || undefined,
        fines_charges: charges.fines_charges || undefined,
        damages_charges: charges.damages_charges || undefined,
        fuel_charges: charges.fuel_charges || undefined,
        extra_hour_charges: charges.extra_hour_charges || undefined,
        other_charges: charges.other_charges || undefined,
        deposit_waiver_amount: charges.deposit_waiver_amount || undefined,
        additional_remarks: additionalRemarks.trim() || undefined,
        // Additional driver (optional)
        additional_driver_name: addDriver.additional_driver_name.trim() || undefined,
        additional_driver_license: addDriver.additional_driver_license.trim() || undefined,
        additional_driver_license_expiry: addDriver.additional_driver_license_expiry || undefined,
        additional_driver_eid: addDriver.additional_driver_eid.trim() || undefined,
        additional_driver_dob: addDriver.additional_driver_dob || undefined,
      };
      const cleaned = cleanPayload(rawPayload) as Record<string, unknown>;
      sanitizeUuidFields(cleaned, ['customer_id', 'vehicle_id', 'reservation_id']);
      const payload = cleaned as unknown as CreateAgreementPayload;
      const result = await agreementService.createAgreement(payload);
      toast.success('Agreement created successfully');
      router.push(`/agreements/${result.id || result.data?.id}`);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to create agreement'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/agreements')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiChevronLeft className="h-4 w-4" />
          Back to Agreements
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Agreement</h1>
        <p className="mt-1 text-sm text-gray-500">
          Follow the steps below to create a rental agreement
        </p>
      </div>

      {/* Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isComplete = idx < currentStep;
            const isCurrent = idx === currentStep;
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isComplete ? (
                    <HiCheck className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent ? 'text-blue-600' : isComplete ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0 mx-16">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 min-h-[400px]">
        {/* Step 1: Customer */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Customer</h2>
            <p className="text-sm text-gray-500">Search and select a customer for this agreement</p>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <HiUser className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedCustomer.full_name_en} {selectedCustomer.full_name_ar}
                    </p>
                    <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                    {selectedCustomer.phone_number && (
                      <p className="text-sm text-gray-500">{selectedCustomer.phone_number}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <SearchInput
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Search by name, email, or phone..."
                />
                {loadingCustomers ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : customers.length > 0 ? (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                        }}
                        className="flex w-full items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <HiUser className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {c.full_name_en} {c.full_name_ar}
                          </p>
                          <p className="text-sm text-gray-500">{c.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : customerSearch.trim() ? (
                  <p className="text-center text-sm text-gray-500 py-8">
                    No customers found matching your search
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}

        {/* Step 2: Vehicle */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Select Vehicle</h2>
            <p className="text-sm text-gray-500">Choose an available vehicle for the rental</p>

            {selectedVehicle ? (
              <div className="flex items-center justify-between rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <HiTruck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedVehicle.plate_number} &middot; {selectedVehicle.color}
                    </p>
                    <p className="text-sm text-gray-500">
                      Daily: ${Number(selectedVehicle.daily_rate).toFixed(2)}
                      {selectedVehicle.weekly_rate
                        ? ` | Weekly: $${Number(selectedVehicle.weekly_rate).toFixed(2)}`
                        : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <HiXMark className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <SearchInput
                  value={vehicleSearch}
                  onChange={setVehicleSearch}
                  placeholder="Search by make, model, or plate..."
                />
                {loadingVehicles ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : vehicles.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 max-h-96 overflow-y-auto">
                    {vehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setVehicleSearch('');
                        }}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <HiTruck className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {v.year} {v.make} {v.model}
                          </p>
                          <p className="text-xs text-gray-500">{v.plate_number}</p>
                          <p className="text-xs font-medium text-green-600">
                            ${Number(v.daily_rate).toFixed(2)}/day
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 py-8">
                    No available vehicles found
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Dates */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Rental Dates</h2>
            <p className="text-sm text-gray-500">Set the rental period for this agreement</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rentalStartDatetime}
                  onChange={(e) => setRentalStartDatetime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rentalEndDatetime}
                  onChange={(e) => setRentalEndDatetime(e.target.value)}
                  min={rentalStartDatetime}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {rentalStartDatetime && rentalEndDatetime && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Rental duration:{' '}
                  <span className="font-semibold text-gray-900">
                    {pricing.days} day{pricing.days !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            )}

            {rentalEndDatetime &&
              rentalStartDatetime &&
              new Date(rentalEndDatetime) <= new Date(rentalStartDatetime) && (
                <p className="text-sm text-red-600">
                  End date must be after start date
                </p>
              )}
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Rate Calculation</h2>
            <p className="text-sm text-gray-500">Review and adjust pricing for this rental</p>

            <div className="grid gap-4 sm:grid-cols-3">
              {([
                ['Daily Rate (AED)', dailyRate, setDailyRate],
                ['Weekly Rate (AED)', weeklyRate, setWeeklyRate],
                ['Monthly Rate (AED)', monthlyRate, setMonthlyRate],
              ] as [string, number, (n: number) => void][]).map(([label, val, setter]) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => setter(Number(e.target.value))}
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Mileage policy */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowed KM / Day</label>
                <input
                  type="number"
                  value={kmPerDay}
                  onChange={(e) => setKmPerDay(Number(e.target.value))}
                  min={0}
                  placeholder="e.g. 250"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra KM Rate (AED)</label>
                <input
                  type="number"
                  value={extraKmRate}
                  onChange={(e) => setExtraKmRate(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  placeholder="e.g. 0.50"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Additional Charges & Deposit */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Additional Charges &amp; Deposit</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Optional contract line-items (AED). Leave 0 if not applicable.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {([
                  ['deposit_amount', 'Deposit'],
                  ['cdw_amount', 'CDW'],
                  ['excess_insurance_amount', 'Excess Insurance'],
                  ['delivery_charges', 'Delivery Charges'],
                  ['pickup_charges', 'Pickup Charges'],
                  ['extra_hour_charges', 'Extra Hour Charges'],
                  ['salik_charges', 'Salik / Toll'],
                  ['fines_charges', 'Fines'],
                  ['damages_charges', 'Damages'],
                  ['fuel_charges', 'Fuel Charges'],
                  ['other_charges', 'Other Charges'],
                  ['deposit_waiver_amount', 'Deposit Waiver (−)'],
                ] as [keyof typeof charges, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type="number"
                      value={charges[key]}
                      onChange={(e) => setCharge(key, Number(e.target.value))}
                      min={0}
                      step={0.01}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Remarks</label>
                <textarea
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  rows={2}
                  placeholder="e.g. Used extra kilometer charges 0.30"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Additional Driver (optional) */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Additional Driver</h3>
                <p className="text-xs text-gray-500 mt-0.5">Optional. Appears on the contract if filled.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={addDriver.additional_driver_name}
                    onChange={(e) => setAddDriverField('additional_driver_name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Driving License No.</label>
                  <input
                    type="text"
                    value={addDriver.additional_driver_license}
                    onChange={(e) => setAddDriverField('additional_driver_license', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">License Expiry</label>
                  <input
                    type="date"
                    value={addDriver.additional_driver_license_expiry}
                    onChange={(e) => setAddDriverField('additional_driver_license_expiry', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Emirates ID</label>
                  <input
                    type="text"
                    value={addDriver.additional_driver_eid}
                    onChange={(e) => setAddDriverField('additional_driver_eid', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={addDriver.additional_driver_dob}
                    onChange={(e) => setAddDriverField('additional_driver_dob', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
                {pricing.tier !== 'none' && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 capitalize">
                    {pricing.tier} rate applied
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Duration</span>
                  <span className="font-medium">{pricing.days} day{pricing.days !== 1 ? 's' : ''}</span>
                </div>
                {pricing.months > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {pricing.months} month{pricing.months !== 1 ? 's' : ''} x AED {monthlyRate.toFixed(2)}
                    </span>
                    <span className="font-medium">AED {(pricing.months * monthlyRate).toFixed(2)}</span>
                  </div>
                )}
                {pricing.weeks > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {pricing.weeks} week{pricing.weeks !== 1 ? 's' : ''} x AED {weeklyRate.toFixed(2)}
                    </span>
                    <span className="font-medium">AED {(pricing.weeks * weeklyRate).toFixed(2)}</span>
                  </div>
                )}
                {pricing.remainder > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {pricing.remainder} day{pricing.remainder !== 1 ? 's' : ''} x AED {(dailyRate || (weeklyRate ? weeklyRate / 7 : monthlyRate / 30)).toFixed(2)}
                    </span>
                    <span className="font-medium">
                      AED {(pricing.remainder * (dailyRate || (weeklyRate ? weeklyRate / 7 : monthlyRate / 30))).toFixed(2)}
                    </span>
                  </div>
                )}
                {kmPerDay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowed Mileage</span>
                    <span className="font-medium">{kmPerDay} km/day ({kmPerDay * pricing.days} km total)</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-medium text-gray-700">Rental Subtotal</span>
                  <span className="font-semibold text-gray-900">AED {pricing.amount.toFixed(2)}</span>
                </div>
                {chargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Charges &amp; Deposit</span>
                    <span className="font-medium">AED {chargesTotal.toFixed(2)}</span>
                  </div>
                )}
                {charges.deposit_waiver_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Waiver</span>
                    <span className="font-medium text-red-600">− AED {charges.deposit_waiver_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Contract Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    AED {contractTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review & Confirm</h2>
            <p className="text-sm text-gray-500">Review all details before creating the agreement</p>

            <div className="space-y-4">
              {/* Customer */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                <p className="font-semibold text-gray-900">
                  {selectedCustomer?.full_name_en} {selectedCustomer?.full_name_ar}
                </p>
                <p className="text-sm text-gray-500">{selectedCustomer?.email}</p>
              </div>

              {/* Vehicle */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Vehicle</h3>
                <p className="font-semibold text-gray-900">
                  {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                </p>
                <p className="text-sm text-gray-500">{selectedVehicle?.plate_number}</p>
              </div>

              {/* Dates */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Rental Period</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Start:</span>{' '}
                    <span className="font-medium">{new Date(rentalStartDatetime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">End:</span>{' '}
                    <span className="font-medium">{new Date(rentalEndDatetime).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Duration: {pricing.days} day{pricing.days !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Pricing</h3>
                <div className="text-sm space-y-1">
                  {dailyRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Rate</span>
                      <span>AED {dailyRate.toFixed(2)}</span>
                    </div>
                  )}
                  {weeklyRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly Rate</span>
                      <span>AED {weeklyRate.toFixed(2)}</span>
                    </div>
                  )}
                  {monthlyRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Rate</span>
                      <span>AED {monthlyRate.toFixed(2)}</span>
                    </div>
                  )}
                  {kmPerDay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Allowed KM / Day</span>
                      <span>{kmPerDay} km</span>
                    </div>
                  )}
                  {pricing.tier !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate Applied</span>
                      <span className="capitalize">{pricing.tier}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span className="text-gray-600">Rental Subtotal</span>
                    <span className="font-medium">AED {pricing.amount.toFixed(2)}</span>
                  </div>
                  {chargesTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Additional Charges &amp; Deposit</span>
                      <span className="font-medium">AED {chargesTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {charges.deposit_waiver_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Waiver</span>
                      <span className="font-medium text-red-600">− AED {charges.deposit_waiver_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-1">
                    <span className="font-semibold text-gray-900">Contract Total</span>
                    <span className="text-xl font-bold text-blue-600">AED {contractTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <HiChevronLeft className="h-4 w-4" />
          Back
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
            <HiChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <LoadingSpinner />
                Creating...
              </>
            ) : (
              <>
                <HiCheck className="h-5 w-5" />
                Create Agreement
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
