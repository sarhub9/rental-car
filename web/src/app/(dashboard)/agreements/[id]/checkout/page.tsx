'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiChevronLeft,
  HiChevronRight,
  HiCheck,
  HiCamera,
  HiCog6Tooth,
  HiClipboardDocumentList,
  HiClipboardDocumentCheck,
  HiXMark,
  HiPlus,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { extractApiError } from '@/lib/api-error';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const STEPS = [
  { label: 'Photos', icon: HiCamera },
  { label: 'Odometer & Fuel', icon: HiCog6Tooth },
  { label: 'Accessories', icon: HiClipboardDocumentList },
  { label: 'Review', icon: HiClipboardDocumentCheck },
];

const PHOTO_ANGLES = [
  { key: 'FRONT', label: 'Front' },
  { key: 'BACK', label: 'Back' },
  { key: 'LEFT', label: 'Left Side' },
  { key: 'RIGHT', label: 'Right Side' },
  { key: 'INTERIOR', label: 'Interior' },
  { key: 'DASHBOARD', label: 'Dashboard' },
];

const FUEL_LEVELS = [
  { value: 'EMPTY', label: 'Empty' },
  { value: 'QUARTER', label: '1/4' },
  { value: 'HALF', label: '1/2' },
  { value: 'THREE_QUARTER', label: '3/4' },
  { value: 'FULL', label: 'Full' },
];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Photos
  const [photos, setPhotos] = useState<Record<string, File | null>>({
    FRONT: null,
    BACK: null,
    LEFT: null,
    RIGHT: null,
    INTERIOR: null,
    DASHBOARD: null,
  });
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});

  // Step 2: Odometer & Fuel
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');

  // Step 3: Accessories
  const [accessories, setAccessories] = useState<string[]>([]);
  const [accessoryInput, setAccessoryInput] = useState('');

  // (Signature is captured on the agreement before activation — not in checkout.)

  const handlePhotoChange = (angle: string, file: File | null) => {
    setPhotos((prev) => ({ ...prev, [angle]: file }));
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreviews((prev) => ({ ...prev, [angle]: url }));
    } else {
      setPhotoPreviews((prev) => {
        const copy = { ...prev };
        if (copy[angle]) URL.revokeObjectURL(copy[angle]);
        delete copy[angle];
        return copy;
      });
    }
  };

  const addAccessory = () => {
    const trimmed = accessoryInput.trim();
    if (trimmed && !accessories.includes(trimmed)) {
      setAccessories((prev) => [...prev, trimmed]);
      setAccessoryInput('');
    }
  };

  const removeAccessory = (item: string) => {
    setAccessories((prev) => prev.filter((a) => a !== item));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return Object.values(photos).some((f) => f !== null);
      case 1:
        return !!odometerReading && !!fuelLevel;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();

      Object.entries(photos).forEach(([angle, file]) => {
        if (file) {
          formData.append('photos', file);
          formData.append('photo_angles', angle);
        }
      });

      formData.append('odometer_reading', odometerReading);
      formData.append('fuel_level', fuelLevel);
      formData.append('accessories', JSON.stringify(accessories));

      await agreementService.checkoutAgreement(id, formData);
      toast.success('Checkout completed successfully');
      router.push(`/agreements/${id}`);
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to complete checkout'));
    } finally {
      setSubmitting(false);
    }
  };

  const uploadedPhotosCount = Object.values(photos).filter(Boolean).length;

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
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete the checkout process to activate this agreement
        </p>
      </div>

      {/* Progress Bar */}
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
                  {isComplete ? <HiCheck className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
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
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0 mx-16">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 min-h-[400px]">
        {/* Step 1: Photos */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Photos</h2>
            <p className="text-sm text-gray-500">
              Upload photos from each angle of the vehicle ({uploadedPhotosCount}/{PHOTO_ANGLES.length} uploaded)
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PHOTO_ANGLES.map((angle) => (
                <div key={angle.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{angle.label}</label>
                  <div className="relative">
                    {photoPreviews[angle.key] ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-200 bg-gray-100">
                        <img
                          src={photoPreviews[angle.key]}
                          alt={angle.label}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handlePhotoChange(angle.key, null)}
                          className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <HiXMark className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <HiCamera className="h-8 w-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Click to upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handlePhotoChange(angle.key, e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Odometer & Fuel */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Odometer & Fuel Level</h2>
            <p className="text-sm text-gray-500">Record the current odometer reading and fuel level</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Odometer Reading (miles)
                </label>
                <input
                  type="number"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(e.target.value)}
                  placeholder="e.g. 45230"
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fuel Level
                </label>
                <select
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select fuel level</option>
                  {FUEL_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fuel gauge visual */}
            {fuelLevel && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600 mb-2">Fuel Gauge</p>
                <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fuelLevel === 'FULL'
                        ? 'bg-green-500'
                        : fuelLevel === 'THREE_QUARTER'
                        ? 'bg-green-400'
                        : fuelLevel === 'HALF'
                        ? 'bg-yellow-400'
                        : fuelLevel === 'QUARTER'
                        ? 'bg-orange-400'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width:
                        fuelLevel === 'FULL'
                          ? '100%'
                          : fuelLevel === 'THREE_QUARTER'
                          ? '75%'
                          : fuelLevel === 'HALF'
                          ? '50%'
                          : fuelLevel === 'QUARTER'
                          ? '25%'
                          : '5%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Accessories */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Accessories Checklist</h2>
            <p className="text-sm text-gray-500">Add items present in the vehicle at checkout</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={accessoryInput}
                onChange={(e) => setAccessoryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAccessory()}
                placeholder="e.g. Spare tire, Jack, First aid kit..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addAccessory}
                disabled={!accessoryInput.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <HiPlus className="h-4 w-4" />
                Add
              </button>
            </div>

            {accessories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {accessories.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700"
                  >
                    {item}
                    <button
                      onClick={() => removeAccessory(item)}
                      className="rounded-full hover:bg-blue-200 p-0.5"
                    >
                      <HiXMark className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
                <HiClipboardDocumentList className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No accessories added yet</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review Checkout Details</h2>
            <p className="text-sm text-gray-500">Confirm all information is correct before completing checkout</p>

            <div className="space-y-4">
              {/* Photos summary */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Photos ({uploadedPhotosCount}/{PHOTO_ANGLES.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PHOTO_ANGLES.map((angle) => (
                    <div key={angle.key} className="text-center">
                      {photoPreviews[angle.key] ? (
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={photoPreviews[angle.key]}
                            alt={angle.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <HiCamera className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{angle.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Odometer & Fuel */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Odometer & Fuel
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Odometer:</span>{' '}
                    <span className="font-semibold">{odometerReading} mi</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Fuel Level:</span>{' '}
                    <span className="font-semibold">
                      {FUEL_LEVELS.find((l) => l.value === fuelLevel)?.label || fuelLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accessories */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Accessories ({accessories.length})
                </h3>
                {accessories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {accessories.map((item) => (
                      <span
                        key={item}
                        className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No accessories listed</p>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pb-8">
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
                Processing...
              </>
            ) : (
              <>
                <HiCheck className="h-5 w-5" />
                Complete Checkout
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
