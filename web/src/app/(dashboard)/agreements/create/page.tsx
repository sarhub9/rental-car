'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck,
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
  HiXMark,
  HiUser,
  HiUserPlus,
  HiTruck,
  HiPhone,
  HiEnvelope,
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
  dayRate: number; // per-day rate applied to the leftover days
}

function calculateAmount(
  startDate: string,
  endDate: string,
  dailyRate: number,
  weeklyRate: number,
  monthlyRate: number
): Pricing {
  const empty: Pricing = { days: 0, months: 0, weeks: 0, remainder: 0, amount: 0, tier: 'none', dayRate: 0 };
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
    if (tier === 'daily') tier = 'weekly';
  }

  // Per-day rate for the leftover days, matched to the active tier so the
  // breakdown never bills a monthly rental's extra days at the pricier daily rate:
  //  - monthly → leftover days prorated at monthly/30
  //  - weekly  → daily rate (or weekly/7 if no daily rate is set)
  //  - daily   → daily rate, falling back to a weekly/monthly prorate
  let dayRate = 0;
  if (remaining > 0) {
    if (tier === 'monthly') {
      dayRate = monthlyRate / 30;
    } else if (tier === 'weekly') {
      dayRate = dailyRate || weeklyRate / 7;
    } else {
      dayRate = dailyRate || (weeklyRate ? weeklyRate / 7 : monthlyRate ? monthlyRate / 30 : 0);
    }
    amount += remaining * dayRate;
  }

  return { days, months, weeks, remainder: remaining, amount, tier, dayRate };
}

// Format a Date into the `YYYY-MM-DDTHH:mm` string a datetime-local input expects,
// using LOCAL time (not UTC, which toISOString would give).
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Nice human-readable label for a datetime-local value, e.g. "Tue, 11 Nov 2025, 9:00 AM".
function formatFriendly(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Quick-duration presets: label + how many days to add to the start.
const DURATION_PRESETS: { label: string; days: number }[] = [
  { label: '1 day', days: 1 },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

// First letters of a name, for avatar chips. Falls back to a person glyph.
function initials(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// A money input with an "AED" prefix. Shows empty (not 0) and selects on focus
// so staff can type straight over it. Used across all price/charge fields.
function MoneyInput({
  value,
  onChange,
  placeholder = '0.00',
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-gray-400">
        AED
      </span>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={(e) => e.target.select()}
        min={0}
        step={0.01}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 pl-12 pr-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
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
  // Manual price adjustment on the rental subtotal: positive = surcharge,
  // negative = discount. Lets staff correct the auto-calculated rent (e.g. bill
  // the leftover days of a monthly rental, or apply a negotiated discount).
  const [rentAdjustment, setRentAdjustment] = useState(0);
  // Per-line overrides for the rent breakdown. `null` = use the calculated
  // amount; a number = the staff-edited amount for that line.
  const [lineOverride, setLineOverride] = useState<{
    month: number | null;
    week: number | null;
    day: number | null;
  }>({ month: null, week: null, day: null });
  const setLine = (key: 'month' | 'week' | 'day', val: number | null) =>
    setLineOverride((o) => ({ ...o, [key]: val }));

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

  // Per-unit rate for each breakdown line. A manual override (edited in the
  // breakdown) wins over the tier rate; the line total is always count × rate,
  // so the multiplication (e.g. 30 days × rate) is always applied.
  const monthUnit = lineOverride.month ?? monthlyRate;
  const weekUnit = lineOverride.week ?? weeklyRate;
  const dayUnit = lineOverride.day ?? pricing.dayRate;
  const monthLine = pricing.months > 0 ? pricing.months * monthUnit : 0;
  const weekLine = pricing.weeks > 0 ? pricing.weeks * weekUnit : 0;
  const dayLine = pricing.remainder > 0 ? pricing.remainder * dayUnit : 0;
  const rentBeforeAdjust = monthLine + weekLine + dayLine;

  // Rental subtotal after the manual adjustment (never below zero).
  const adjustedRent = useMemo(
    () => Math.max(0, rentBeforeAdjust + (Number(rentAdjustment) || 0)),
    [rentBeforeAdjust, rentAdjustment]
  );

  // Config for rendering the editable rent breakdown lines. `unit` is the
  // editable per-unit rate; `value`/`total` is count × unit.
  const rentLines = [
    {
      key: 'month' as const,
      show: pricing.months > 0,
      count: pricing.months,
      noun: 'month',
      unit: monthUnit,
      value: monthLine,
      overridden: lineOverride.month != null,
    },
    {
      key: 'week' as const,
      show: pricing.weeks > 0,
      count: pricing.weeks,
      noun: 'week',
      unit: weekUnit,
      value: weekLine,
      overridden: lineOverride.week != null,
    },
    {
      key: 'day' as const,
      show: pricing.remainder > 0,
      count: pricing.remainder,
      noun: 'day',
      unit: dayUnit,
      value: dayLine,
      overridden: lineOverride.day != null,
    },
  ];

  // Grand total as shown on the printed contract: rent + charges + deposit − waiver.
  const contractTotal = useMemo(
    () => adjustedRent + chargesTotal - (Number(charges.deposit_waiver_amount) || 0),
    [adjustedRent, chargesTotal, charges.deposit_waiver_amount]
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

  // Search customers — load a default list when empty, debounce while typing.
  useEffect(() => {
    const delay = customerSearch.trim() ? 400 : 0;
    setLoadingCustomers(true);
    const timeout = setTimeout(async () => {
      try {
        const res = customerSearch.trim()
          ? await customerService.searchCustomers(customerSearch)
          : await customerService.getCustomers({ limit: 20 });
        const items = Array.isArray(res) ? res : (res?.data || []);
        setCustomers(items);
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to search customers'));
      } finally {
        setLoadingCustomers(false);
      }
    }, delay);
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
        estimated_amount: adjustedRent,
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Select Customer</h2>
                <p className="text-sm text-gray-500">Search and select a customer for this agreement</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/customers/create')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <HiUserPlus className="h-4 w-4" />
                New Customer
              </button>
            </div>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {initials(selectedCustomer.full_name_en) || <HiUser className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {selectedCustomer.full_name_en} {selectedCustomer.full_name_ar}
                      </p>
                      <HiCheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-600">
                      {selectedCustomer.email && (
                        <span className="inline-flex items-center gap-1">
                          <HiEnvelope className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.email}
                        </span>
                      )}
                      {selectedCustomer.phone_number && (
                        <span className="inline-flex items-center gap-1">
                          <HiPhone className="h-4 w-4 text-gray-400" />
                          {selectedCustomer.phone_number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
                >
                  <HiXMark className="h-4 w-4" />
                  Change
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
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : customers.length > 0 ? (
                  <>
                    {!customerSearch.trim() && (
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Recent customers
                      </p>
                    )}
                    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                          className="group flex w-full items-center gap-4 p-4 text-left hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                            {initials(c.full_name_en) || <HiUser className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900">
                              {c.full_name_en} {c.full_name_ar}
                            </p>
                            <div className="flex flex-wrap gap-x-3 text-sm text-gray-500">
                              {c.email && <span className="truncate">{c.email}</span>}
                              {c.phone_number && <span>{c.phone_number}</span>}
                            </div>
                          </div>
                          <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-blue-500" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : customerSearch.trim() ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
                    <HiMagnifyingGlass className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      No customers found for &ldquo;{customerSearch}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/customers/create')}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <HiUserPlus className="h-4 w-4" />
                      Add a new customer
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
                    <HiUser className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">Start typing to search customers</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Vehicle */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Select Vehicle</h2>
                <p className="text-sm text-gray-500">Choose an available vehicle for the rental</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/vehicles/create')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <HiTruck className="h-4 w-4" />
                New Vehicle
              </button>
            </div>

            {selectedVehicle ? (
              <div className="flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <HiTruck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <HiCheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">{selectedVehicle.plate_number}</span>
                      {selectedVehicle.color ? ` · ${selectedVehicle.color}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                        Daily AED {Number(selectedVehicle.daily_rate).toFixed(2)}
                      </span>
                      {selectedVehicle.weekly_rate ? (
                        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                          Weekly AED {Number(selectedVehicle.weekly_rate).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
                >
                  <HiXMark className="h-4 w-4" />
                  Change
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
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : vehicles.length > 0 ? (
                  <>
                    {!vehicleSearch.trim() && (
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Available vehicles
                      </p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 max-h-96 overflow-y-auto p-0.5">
                      {vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicle(v);
                            setVehicleSearch('');
                          }}
                          className="group flex items-center gap-3 rounded-xl border border-gray-200 p-4 text-left hover:border-blue-400 hover:shadow-sm hover:bg-blue-50/40 transition-all"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-blue-100">
                            <HiTruck className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {v.year} {v.make} {v.model}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {v.plate_number}
                              {v.color ? ` · ${v.color}` : ''}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">
                              AED {Number(v.daily_rate).toFixed(2)}
                              <span className="text-xs font-normal text-gray-500">/day</span>
                            </p>
                          </div>
                          <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-blue-500" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-10 text-center">
                    <HiTruck className="h-8 w-8 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">
                      {vehicleSearch.trim()
                        ? `No available vehicles found for “${vehicleSearch}”`
                        : 'No available vehicles right now'}
                    </p>
                  </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Pick-up Date &amp; Time
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setSeconds(0, 0);
                      setRentalStartDatetime(toLocalInput(now));
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Start now
                  </button>
                </div>
                <div className="relative">
                  <HiCalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={rentalStartDatetime}
                    onChange={(e) => setRentalStartDatetime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {rentalStartDatetime && (
                  <p className="mt-1.5 text-xs text-gray-500">{formatFriendly(rentalStartDatetime)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Return Date &amp; Time
                </label>
                <div className="relative">
                  <HiCalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={rentalEndDatetime}
                    onChange={(e) => setRentalEndDatetime(e.target.value)}
                    min={rentalStartDatetime}
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {rentalEndDatetime && (
                  <p className="mt-1.5 text-xs text-gray-500">{formatFriendly(rentalEndDatetime)}</p>
                )}
              </div>
            </div>

            {/* Quick duration: pick how long, end date fills in automatically. */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick duration</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => {
                  const active =
                    rentalStartDatetime &&
                    rentalEndDatetime &&
                    Math.round(
                      (new Date(rentalEndDatetime).getTime() - new Date(rentalStartDatetime).getTime()) /
                        86400000
                    ) === preset.days;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        let startStr = rentalStartDatetime;
                        if (!startStr) {
                          const n = new Date();
                          n.setSeconds(0, 0);
                          startStr = toLocalInput(n);
                          setRentalStartDatetime(startStr);
                        }
                        const base = new Date(startStr);
                        base.setDate(base.getDate() + preset.days);
                        setRentalEndDatetime(toLocalInput(base));
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {!rentalStartDatetime && (
                <p className="mt-2 text-xs text-gray-400">
                  A duration button will start the rental from now.
                </p>
              )}
            </div>

            {/* Summary card: pick-up → return with total duration */}
            {rentalStartDatetime &&
              rentalEndDatetime &&
              new Date(rentalEndDatetime) > new Date(rentalStartDatetime) && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Pick-up</p>
                      <p className="truncate text-sm font-medium text-gray-900">
                        {formatFriendly(rentalStartDatetime)}
                      </p>
                    </div>
                    <HiChevronRight className="h-5 w-5 shrink-0 text-blue-400" />
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Return</p>
                      <p className="truncate text-sm font-medium text-gray-900">
                        {formatFriendly(rentalEndDatetime)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-blue-200 pt-3">
                    <span className="text-sm text-gray-600">Total duration</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {pricing.days} day{pricing.days !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

            {rentalEndDatetime &&
              rentalStartDatetime &&
              new Date(rentalEndDatetime) <= new Date(rentalStartDatetime) && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <HiXMark className="h-4 w-4 shrink-0" />
                  Return date must be after the pick-up date.
                </div>
              )}
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Rate Calculation</h2>
            <p className="text-sm text-gray-500">Review and adjust pricing for this rental</p>

            {/* Rates & mileage */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-center gap-2">
                <HiCurrencyDollar className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Rental Rates &amp; Mileage</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {([
                  ['Daily Rate', dailyRate, setDailyRate],
                  ['Weekly Rate', weeklyRate, setWeeklyRate],
                  ['Monthly Rate', monthlyRate, setMonthlyRate],
                ] as [string, number, (n: number) => void][]).map(([label, val, setter]) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <MoneyInput value={val} onChange={setter} />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowed KM / Day</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={kmPerDay || ''}
                      onChange={(e) => setKmPerDay(Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      min={0}
                      placeholder="e.g. 250"
                      className="w-full rounded-lg border border-gray-300 pl-3 pr-12 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-gray-400">
                      km
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra KM Rate</label>
                  <MoneyInput value={extraKmRate} onChange={setExtraKmRate} placeholder="e.g. 0.50" />
                </div>
              </div>
            </div>

            {/* Additional Charges & Deposit */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-2">
                <HiClipboardDocumentCheck className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">Additional Charges &amp; Deposit</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Optional contract line-items (AED). Leave blank if not applicable.
                  </p>
                </div>
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
                    <MoneyInput value={charges[key]} onChange={(n) => setCharge(key, n)} />
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
              <div className="flex items-start gap-2">
                <HiUser className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">Additional Driver</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Optional. Appears on the contract if filled.</p>
                </div>
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
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
                </div>
                {pricing.tier !== 'none' && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 capitalize">
                    {pricing.tier} rate applied
                  </span>
                )}
              </div>
              <p className="-mt-2 text-xs text-gray-500">
                Tip: edit a line&rsquo;s rate and the total recalculates as count × rate.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Duration</span>
                  <span className="font-medium">{pricing.days} day{pricing.days !== 1 ? 's' : ''}</span>
                </div>
                {/* Editable breakdown lines — edit the per-unit rate; total = count × rate. */}
                {rentLines.filter((l) => l.show).map((l) => (
                  <div key={l.key} className="flex items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-gray-600">
                      <span className="font-medium text-gray-700">
                        {l.count} {l.noun}{l.count !== 1 ? 's' : ''}
                      </span>
                      ×
                      <span className="text-xs text-gray-400">AED</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={Number(l.unit.toFixed(2))}
                        onChange={(e) =>
                          setLine(l.key, e.target.value === '' ? null : Number(e.target.value))
                        }
                        onFocus={(e) => e.target.select()}
                        className={`w-24 rounded-md border px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          l.overridden ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                        }`}
                      />
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {l.overridden && (
                        <button
                          type="button"
                          onClick={() => setLine(l.key, null)}
                          title="Reset to the calculated rate"
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Reset
                        </button>
                      )}
                      <span className="font-medium text-gray-900">= AED {l.value.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
                {kmPerDay > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Allowed Mileage</span>
                    <span className="font-medium">{kmPerDay} km/day ({kmPerDay * pricing.days} km total)</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-gray-600">Rent Subtotal (before adjustment)</span>
                  <span className="font-medium text-gray-900">AED {rentBeforeAdjust.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Price Adjustment
                    <span className="block text-xs text-gray-400">+ surcharge / − discount</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs">AED</span>
                    <input
                      type="number"
                      step="0.01"
                      value={rentAdjustment || ''}
                      onChange={(e) => setRentAdjustment(Number(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-28 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Rental Subtotal</span>
                  <span className="font-semibold text-gray-900">AED {adjustedRent.toFixed(2)}</span>
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
                <div className="mt-1 flex items-center justify-between rounded-lg bg-blue-600 px-4 py-3">
                  <span className="font-semibold text-white">Contract Total</span>
                  <span className="text-xl font-bold text-white">AED {contractTotal.toFixed(2)}</span>
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
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <HiUser className="h-4 w-4" /> Customer
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {initials(selectedCustomer?.full_name_en) || <HiUser className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {selectedCustomer?.full_name_en} {selectedCustomer?.full_name_ar}
                    </p>
                    <div className="flex flex-wrap gap-x-3 text-sm text-gray-500">
                      {selectedCustomer?.email && <span className="truncate">{selectedCustomer.email}</span>}
                      {selectedCustomer?.phone_number && <span>{selectedCustomer.phone_number}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <HiTruck className="h-4 w-4" /> Vehicle
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <HiTruck className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedVehicle?.plate_number}
                      {selectedVehicle?.color ? ` · ${selectedVehicle.color}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <HiCalendarDays className="h-4 w-4" /> Rental Period
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pick-up</p>
                    <p className="truncate text-sm font-medium text-gray-900">{formatFriendly(rentalStartDatetime)}</p>
                  </div>
                  <HiChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Return</p>
                    <p className="truncate text-sm font-medium text-gray-900">{formatFriendly(rentalEndDatetime)}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t border-gray-100 pt-2 text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900">{pricing.days} day{pricing.days !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <HiCurrencyDollar className="h-4 w-4" /> Pricing
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  {/* Actual breakdown line amounts — these sum to the Rent Subtotal. */}
                  {rentLines.filter((l) => l.show).map((l) => (
                    <div key={l.key} className="flex justify-between">
                      <span className="text-gray-600">
                        {l.count} {l.noun}{l.count !== 1 ? 's' : ''} × AED {l.unit.toFixed(2)}
                      </span>
                      <span className="font-medium">AED {l.value.toFixed(2)}</span>
                    </div>
                  ))}
                  {kmPerDay > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Allowed Mileage</span>
                      <span>{kmPerDay} km/day</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span className="text-gray-600">Rent Subtotal</span>
                    <span className="font-medium">AED {rentBeforeAdjust.toFixed(2)}</span>
                  </div>
                  {rentAdjustment !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Adjustment</span>
                      <span className={`font-medium ${rentAdjustment < 0 ? 'text-red-600' : ''}`}>
                        {rentAdjustment < 0 ? '−' : '+'} AED {Math.abs(rentAdjustment).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental Subtotal</span>
                    <span className="font-medium">AED {adjustedRent.toFixed(2)}</span>
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
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-600 px-4 py-3">
                    <span className="font-semibold text-white">Contract Total</span>
                    <span className="text-xl font-bold text-white">AED {contractTotal.toFixed(2)}</span>
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
