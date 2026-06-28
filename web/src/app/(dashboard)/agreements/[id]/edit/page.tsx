'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiChevronLeft,
  HiCheck,
  HiUser,
  HiTruck,
  HiXMark,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { extractApiError } from '@/lib/api-error';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';
import type { Agreement, Customer, Vehicle } from '@/types';

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

function formatDatetimeLocal(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreement, setAgreement] = useState<Agreement | null>(null);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [rentalStartDatetime, setRentalStartDatetime] = useState('');
  const [rentalEndDatetime, setRentalEndDatetime] = useState('');
  const [dailyRate, setDailyRate] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [monthlyRate, setMonthlyRate] = useState(0);
  const [kmPerDay, setKmPerDay] = useState(0);
  const [extraKmRate, setExtraKmRate] = useState(0);

  // Contract charges & deposit
  const [charges, setCharges] = useState({
    deposit_amount: 0, cdw_amount: 0, excess_insurance_amount: 0,
    delivery_charges: 0, pickup_charges: 0, extra_hour_charges: 0,
    salik_charges: 0, fines_charges: 0, damages_charges: 0,
    fuel_charges: 0, other_charges: 0, deposit_waiver_amount: 0,
  });
  const setCharge = (key: keyof typeof charges, val: number) =>
    setCharges((c) => ({ ...c, [key]: val }));
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // Additional driver
  const [addDriver, setAddDriver] = useState({
    additional_driver_name: '', additional_driver_license: '',
    additional_driver_license_expiry: '', additional_driver_eid: '', additional_driver_dob: '',
  });
  const setAddDriverField = (key: keyof typeof addDriver, val: string) =>
    setAddDriver((d) => ({ ...d, [key]: val }));

  // Company terms (read-only here; edited from Settings → Company Profile)
  const [companyTerms, setCompanyTerms] = useState('');

  // Search state
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const pricing = useMemo(
    () => calculateAmount(rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate),
    [rentalStartDatetime, rentalEndDatetime, dailyRate, weeklyRate]
  );

  // Load agreement
  useEffect(() => {
    if (!id) return;
    const fetchAgreement = async () => {
      try {
        setLoading(true);
        const res = await agreementService.getAgreementById(id);
        const agr = res.data || res;
        setAgreement(agr);

        if (agr.status !== 'DRAFT') {
          toast.error('Only draft agreements can be edited');
          router.push(`/agreements/${id}`);
          return;
        }

        if (agr.customer) setSelectedCustomer(agr.customer);
        if (agr.vehicle) setSelectedVehicle(agr.vehicle);
        if (agr.rental_start_datetime) setRentalStartDatetime(formatDatetimeLocal(agr.rental_start_datetime));
        if (agr.rental_end_datetime) setRentalEndDatetime(formatDatetimeLocal(agr.rental_end_datetime));
        setDailyRate(Number(agr.daily_rate) || 0);
        setWeeklyRate(Number(agr.weekly_rate) || 0);
        setMonthlyRate(Number(agr.monthly_rate) || 0);
        setKmPerDay(Number(agr.km_allowance_per_day) || 0);
        setExtraKmRate(Number(agr.rate_per_extra_km) || 0);
        const num = (x: any) => Number(x) || 0;
        setCharges({
          deposit_amount: num(agr.deposit_amount), cdw_amount: num(agr.cdw_amount),
          excess_insurance_amount: num(agr.excess_insurance_amount),
          delivery_charges: num(agr.delivery_charges), pickup_charges: num(agr.pickup_charges),
          extra_hour_charges: num(agr.extra_hour_charges), salik_charges: num(agr.salik_charges),
          fines_charges: num(agr.fines_charges), damages_charges: num(agr.damages_charges),
          fuel_charges: num(agr.fuel_charges), other_charges: num(agr.other_charges),
          deposit_waiver_amount: num(agr.deposit_waiver_amount),
        });
        setAdditionalRemarks(agr.additional_remarks || '');
        setCompanyTerms((agr as any).company?.agreement_terms || '');
        const d10 = (x: any) => (x ? String(x).substring(0, 10) : '');
        setAddDriver({
          additional_driver_name: agr.additional_driver_name || '',
          additional_driver_license: agr.additional_driver_license || '',
          additional_driver_license_expiry: d10(agr.additional_driver_license_expiry),
          additional_driver_eid: agr.additional_driver_eid || '',
          additional_driver_dob: d10(agr.additional_driver_dob),
        });
      } catch (error: any) {
        toast.error(extractApiError(error, 'Failed to load agreement'));
        router.push('/agreements');
      } finally {
        setLoading(false);
      }
    };
    fetchAgreement();
  }, [id, router]);

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
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to search customers'));
      } finally {
        setLoadingCustomers(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Search vehicles
  useEffect(() => {
    if (!showVehicleSearch) return;
    const timeout = setTimeout(async () => {
      try {
        setLoadingVehicles(true);
        const p: Record<string, any> = { limit: 20, status: 'AVAILABLE' };
        if (vehicleSearch.trim()) p.search = vehicleSearch;
        const res = await vehicleService.getVehicles(p);
        setVehicles(res.data || []);
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to search vehicles'));
      } finally {
        setLoadingVehicles(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [vehicleSearch, showVehicleSearch]);

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedVehicle) {
      toast.error('Please select a customer and vehicle');
      return;
    }
    if (!rentalStartDatetime || !rentalEndDatetime) {
      toast.error('Please set rental dates');
      return;
    }
    if (new Date(rentalEndDatetime) <= new Date(rentalStartDatetime)) {
      toast.error('End date must be after start date');
      return;
    }
    if (dailyRate <= 0 && weeklyRate <= 0 && monthlyRate <= 0) {
      toast.error('At least one rate (daily, weekly or monthly) is required');
      return;
    }

    try {
      setSubmitting(true);
      await agreementService.updateAgreement(id, {
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        rental_start_datetime: rentalStartDatetime,
        rental_end_datetime: rentalEndDatetime,
        daily_rate: dailyRate || undefined,
        weekly_rate: weeklyRate || undefined,
        monthly_rate: monthlyRate || undefined,
        km_allowance_per_day: kmPerDay || undefined,
        rate_per_extra_km: extraKmRate || undefined,
        estimated_amount: pricing.amount,
        // Contract charges & deposit
        deposit_amount: charges.deposit_amount,
        cdw_amount: charges.cdw_amount,
        excess_insurance_amount: charges.excess_insurance_amount,
        delivery_charges: charges.delivery_charges,
        pickup_charges: charges.pickup_charges,
        extra_hour_charges: charges.extra_hour_charges,
        salik_charges: charges.salik_charges,
        fines_charges: charges.fines_charges,
        damages_charges: charges.damages_charges,
        fuel_charges: charges.fuel_charges,
        other_charges: charges.other_charges,
        deposit_waiver_amount: charges.deposit_waiver_amount,
        additional_remarks: additionalRemarks.trim() || undefined,
        // Additional driver
        additional_driver_name: addDriver.additional_driver_name.trim() || undefined,
        additional_driver_license: addDriver.additional_driver_license.trim() || undefined,
        additional_driver_license_expiry: addDriver.additional_driver_license_expiry || undefined,
        additional_driver_eid: addDriver.additional_driver_eid.trim() || undefined,
        additional_driver_dob: addDriver.additional_driver_dob || undefined,
      });
      toast.success('Agreement updated successfully');
      router.push(`/agreements/${id}`);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to update agreement'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/agreements/${id}`)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiChevronLeft className="h-4 w-4" />
          Back to Agreement
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Agreement</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of this draft agreement
        </p>
      </div>

      {/* Customer Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiUser className="h-5 w-5 text-gray-400" />
            Customer
          </h2>
          <button
            onClick={() => setShowCustomerSearch(!showCustomerSearch)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showCustomerSearch ? 'Cancel' : 'Change'}
          </button>
        </div>

        {selectedCustomer && !showCustomerSearch && (
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <HiUser className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedCustomer.full_name_en} {selectedCustomer.full_name_ar}
              </p>
              <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
            </div>
          </div>
        )}

        {showCustomerSearch && (
          <div className="space-y-3">
            <SearchInput
              value={customerSearch}
              onChange={setCustomerSearch}
              placeholder="Search customers..."
            />
            {loadingCustomers ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : customers.length > 0 ? (
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setShowCustomerSearch(false);
                      setCustomerSearch('');
                    }}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <HiUser className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.full_name_en} {c.full_name_ar}
                      </p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : customerSearch.trim() ? (
              <p className="text-center text-sm text-gray-500 py-4">No customers found</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Vehicle Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HiTruck className="h-5 w-5 text-gray-400" />
            Vehicle
          </h2>
          <button
            onClick={() => setShowVehicleSearch(!showVehicleSearch)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showVehicleSearch ? 'Cancel' : 'Change'}
          </button>
        </div>

        {selectedVehicle && !showVehicleSearch && (
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <HiTruck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </p>
              <p className="text-sm text-gray-500">{selectedVehicle.plate_number}</p>
            </div>
          </div>
        )}

        {showVehicleSearch && (
          <div className="space-y-3">
            <SearchInput
              value={vehicleSearch}
              onChange={setVehicleSearch}
              placeholder="Search vehicles..."
            />
            {loadingVehicles ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVehicle(v);
                      setDailyRate(Number(v.daily_rate) || dailyRate);
                      setWeeklyRate(Number(v.weekly_rate) || weeklyRate);
                      setShowVehicleSearch(false);
                      setVehicleSearch('');
                    }}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <HiTruck className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs text-gray-500">{v.plate_number}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">No available vehicles found</p>
            )}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Rental Dates</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time</label>
            <input
              type="datetime-local"
              value={rentalStartDatetime}
              onChange={(e) => setRentalStartDatetime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time</label>
            <input
              type="datetime-local"
              value={rentalEndDatetime}
              onChange={(e) => setRentalEndDatetime(e.target.value)}
              min={rentalStartDatetime}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        {pricing.days > 0 && (
          <p className="text-sm text-gray-600">
            Duration: <span className="font-semibold">{pricing.days} day{pricing.days !== 1 ? 's' : ''}</span>
          </p>
        )}
      </div>

      {/* Rates */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {([
            ['Daily Rate (AED)', dailyRate, setDailyRate],
            ['Weekly Rate (AED)', weeklyRate, setWeeklyRate],
            ['Monthly Rate (AED)', monthlyRate, setMonthlyRate],
          ] as [string, number, (n: number) => void][]).map(([label, val, setter]) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type="number" value={val} onChange={(e) => setter(Number(e.target.value))} min={0} step={0.01}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowed KM / Day</label>
            <input type="number" value={kmPerDay} onChange={(e) => setKmPerDay(Number(e.target.value))} min={0}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra KM Rate (AED)</label>
            <input type="number" value={extraKmRate} onChange={(e) => setExtraKmRate(Number(e.target.value))} min={0} step={0.01}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        {pricing.amount > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estimated Rental Total</span>
            <span className="text-xl font-bold text-blue-600">AED {pricing.amount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Charges & Deposit */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Additional Charges &amp; Deposit</h2>
          <p className="text-xs text-gray-500 mt-0.5">Contract line-items (AED). Leave 0 if not applicable.</p>
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
              <input type="number" value={charges[key]} onChange={(e) => setCharge(key, Number(e.target.value))} min={0} step={0.01}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Remarks</label>
          <textarea value={additionalRemarks} onChange={(e) => setAdditionalRemarks(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
      </div>

      {/* Additional Driver */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Additional Driver</h2>
          <p className="text-xs text-gray-500 mt-0.5">Optional. Appears on the contract if filled.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input type="text" value={addDriver.additional_driver_name} onChange={(e) => setAddDriverField('additional_driver_name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Driving License No.</label>
            <input type="text" value={addDriver.additional_driver_license} onChange={(e) => setAddDriverField('additional_driver_license', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">License Expiry</label>
            <input type="date" value={addDriver.additional_driver_license_expiry} onChange={(e) => setAddDriverField('additional_driver_license_expiry', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Emirates ID</label>
            <input type="text" value={addDriver.additional_driver_eid} onChange={(e) => setAddDriverField('additional_driver_eid', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
            <input type="date" value={addDriver.additional_driver_dob} onChange={(e) => setAddDriverField('additional_driver_dob', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Terms & Conditions (read-only; edited in Settings) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Terms &amp; Conditions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              These appear on the contract. They are not edited here — edit them in <span className="font-medium">Settings → Company Profile → &quot;Agreement Terms &amp; Conditions&quot;</span> (each line becomes a numbered clause).
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/settings')}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit in Settings
          </button>
        </div>

        {companyTerms.trim() ? (
          <ol className="list-decimal pl-5 space-y-1 max-h-64 overflow-y-auto rounded-lg bg-gray-50 border border-gray-100 p-4">
            {companyTerms.split(/\n+/).filter(Boolean).map((t, i) => (
              <li key={i} className="text-xs text-gray-700 leading-snug">{t}</li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            No custom terms are set — the contract automatically uses the <span className="font-semibold">default standard terms</span> (18 clauses: insurance, police report, fuel, salik, fines, smoking, etc.). To set your own, go to Settings.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() => router.push(`/agreements/${id}`)}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : (
            <>
              <HiCheck className="h-5 w-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
