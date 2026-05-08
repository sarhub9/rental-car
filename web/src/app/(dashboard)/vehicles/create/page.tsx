'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleService } from '@/services/vehicle.service';
import type { CreateVehiclePayload } from '@/services/vehicle.service';
import toast from 'react-hot-toast';
import { HiArrowLeft } from 'react-icons/hi2';
import { cleanPayload, sanitizeUuidFields } from '@/lib/clean-payload';

const TRANSMISSION_TYPES = ['AUTOMATIC', 'MANUAL'];
const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'];
const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

export default function CreateVehiclePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plate_number: '',
    plate_emirate: '',
    chassis_number: '',
    transmission_type: 'AUTOMATIC',
    fuel_type: 'PETROL',
    current_odometer: 0,
    daily_rate: 0,
    weekly_rate: 0,
    registration_expiry: '',
    insurance_expiry: '',
    category_id: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.make || !formData.model || !formData.year || !formData.plate_number || !formData.plate_emirate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Clean payload - remove empty strings, format dates as ISO strings
    const cleaned = cleanPayload(formData) as Record<string, unknown>;
    sanitizeUuidFields(cleaned, ['category_id']);
    const payload = cleaned as unknown as CreateVehiclePayload;

    setSubmitting(true);
    try {
      await vehicleService.createVehicle(payload);
      toast.success('Vehicle created successfully');
      router.push('/vehicles');
    } catch (err: any) {
      const details = err?.response?.data?.details;
      const msg = details?.map((d: any) => d.message).join(', ') || err?.response?.data?.message || 'Failed to create vehicle';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Make */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min={2000}
              max={2030}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
            <input
              type="text"
              name="plate_number"
              value={formData.plate_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Plate Emirate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Emirate *</label>
            <select
              name="plate_emirate"
              value={formData.plate_emirate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Emirate</option>
              {EMIRATES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Chassis Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chassis Number</label>
            <input
              type="text"
              name="chassis_number"
              value={formData.chassis_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Transmission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
            <select
              name="transmission_type"
              value={formData.transmission_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TRANSMISSION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Current Odometer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Odometer (km)</label>
            <input
              type="number"
              name="current_odometer"
              value={formData.current_odometer}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Daily Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (AED)</label>
            <input
              type="number"
              name="daily_rate"
              value={formData.daily_rate}
              onChange={handleChange}
              min={0}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Weekly Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (AED)</label>
            <input
              type="number"
              name="weekly_rate"
              value={formData.weekly_rate}
              onChange={handleChange}
              min={0}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Registration Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expiry</label>
            <input
              type="date"
              name="registration_expiry"
              value={formData.registration_expiry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Insurance Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
            <input
              type="date"
              name="insurance_expiry"
              value={formData.insurance_expiry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              placeholder="Enter category ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
