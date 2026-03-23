'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import type { Customer, Vehicle } from '@/types';

const STEPS = [
  { label: 'Customer', icon: HiUser },
  { label: 'Vehicle', icon: HiTruck },
  { label: 'Dates', icon: HiCalendarDays },
  { label: 'Pricing', icon: HiCurrencyDollar },
  { label: 'Review', icon: HiClipboardDocumentCheck },
];

function calculateAmount(
  startDate: string,
  endDate: string,
  dailyRate: number,
  weeklyRate: number
): { days: number; weeks: number; remainder: number; amount: number } {
  if (!startDate || !endDate || dailyRate <= 0) {
    return { days: 0, weeks: 0, remainder: 0, amount: 0 };
  }
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end <= start) return { days: 0, weeks: 0, remainder: 0, amount: 0 };

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  let weeks = 0;
  let remainder = days;
  let amount = 0;

  if (days >= 7 && weeklyRate > 0) {
    weeks = Math.floor(days / 7);
    remainder = days % 7;
    amount = weeks * weeklyRate + remainder * dailyRate;
  } else {
    amount = days * dailyRate;
  }

  return { days, weeks, remainder, amount };
}

export default function CreateAgreementPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const pricing = useMemo(
    () => calculateAmount(rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate),
    [rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate]
  );

  // Search customers
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setLoadingCustomers(true);
        const res = await customerService.getCustomers({ search: customerSearch, limit: 10 });
        setCustomers(res.data || []);
      } catch {
        toast.error('Failed to search customers');
      } finally {
        setLoadingCustomers(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Search vehicles
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        setLoadingVehicles(true);
        const params: Record<string, any> = { limit: 20, status: 'AVAILABLE' };
        if (vehicleSearch.trim()) params.search = vehicleSearch;
        const res = await vehicleService.getVehicles(params);
        setVehicles(res.data || []);
      } catch {
        toast.error('Failed to search vehicles');
      } finally {
        setLoadingVehicles(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [vehicleSearch]);

  // Auto-fill rates when vehicle selected
  useEffect(() => {
    if (selectedVehicle) {
      setDailyRate(Number(selectedVehicle.daily_rate) || 0);
      setWeeklyRate(Number(selectedVehicle.weekly_rate) || 0);
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
        return dailyRate > 0 && pricing.amount > 0;
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
      const payload = {
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        rental_start_datetime: rentalStartDatetime,
        rental_end_datetime: rentalEndDatetime,
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        estimated_amount: pricing.amount,
      };
      const result = await agreementService.createAgreement(payload);
      toast.success('Agreement created successfully');
      router.push(`/agreements/${result.id || result.data?.id}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create agreement');
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

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Daily Rate ($)
                </label>
                <input
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Weekly Rate ($)
                </label>
                <input
                  type="number"
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rental Duration</span>
                  <span className="font-medium">{pricing.days} day{pricing.days !== 1 ? 's' : ''}</span>
                </div>
                {pricing.weeks > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {pricing.weeks} week{pricing.weeks !== 1 ? 's' : ''} x ${weeklyRate.toFixed(2)}
                      </span>
                      <span className="font-medium">
                        ${(pricing.weeks * weeklyRate).toFixed(2)}
                      </span>
                    </div>
                    {pricing.remainder > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {pricing.remainder} day{pricing.remainder !== 1 ? 's' : ''} x ${dailyRate.toFixed(2)}
                        </span>
                        <span className="font-medium">
                          ${(pricing.remainder * dailyRate).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {pricing.weeks === 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {pricing.days} day{pricing.days !== 1 ? 's' : ''} x ${dailyRate.toFixed(2)}
                    </span>
                    <span className="font-medium">
                      ${(pricing.days * dailyRate).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Estimated Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${pricing.amount.toFixed(2)}
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Rate</span>
                    <span>${dailyRate.toFixed(2)}</span>
                  </div>
                  {weeklyRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly Rate</span>
                      <span>${weeklyRate.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span className="font-semibold text-gray-900">Estimated Total</span>
                    <span className="text-xl font-bold text-blue-600">${pricing.amount.toFixed(2)}</span>
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
