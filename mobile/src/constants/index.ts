import { FuelLevel, PhotoAngle } from '../types';

export const FUEL_LEVELS: { value: FuelLevel; label: string; numeric: number }[] = [
  { value: 'EMPTY', label: 'Empty', numeric: 0 },
  { value: 'QUARTER', label: '1/4', numeric: 0.25 },
  { value: 'HALF', label: '1/2', numeric: 0.5 },
  { value: 'THREE_QUARTER', label: '3/4', numeric: 0.75 },
  { value: 'FULL', label: 'Full', numeric: 1.0 },
];

export const PHOTO_ANGLES: { value: PhotoAngle; label: string; required: boolean }[] = [
  { value: 'FRONT', label: 'Front', required: true },
  { value: 'BACK', label: 'Back', required: true },
  { value: 'LEFT', label: 'Left Side', required: true },
  { value: 'RIGHT', label: 'Right Side', required: true },
  { value: 'INTERIOR', label: 'Interior', required: false },
  { value: 'DASHBOARD', label: 'Dashboard', required: false },
  { value: 'DAMAGE', label: 'Damage', required: false },
];

export const MIN_CHECKOUT_PHOTOS = 4;
export const MIN_RETURN_PHOTOS = 4;

export const CHECKOUT_CHECKLIST_ITEMS = [
  { id: 'photos', label: 'Vehicle photos (min 4)' },
  { id: 'odometer', label: 'Odometer reading' },
  { id: 'fuel', label: 'Fuel level' },
  { id: 'accessories', label: 'Accessories check' },
  { id: 'signature', label: 'Customer signature or OTP' },
];

export const RETURN_CHECKLIST_ITEMS = [
  { id: 'photos', label: 'Vehicle photos (min 4)' },
  { id: 'odometer', label: 'Odometer reading' },
  { id: 'fuel', label: 'Fuel level' },
  { id: 'damage', label: 'Damage inspection' },
  { id: 'acknowledgment', label: 'Customer acknowledgment' },
];
