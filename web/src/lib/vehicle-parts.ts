// Shared vehicle-inspection constants used by the inspection editor and the
// printed contract checklist.

export const VEHICLE_PARTS = [
  'Roof', 'Front windshield', 'Bonnet', 'Front bumper', 'Left headlight', 'Right headlight',
  'Back windshield', 'Trunk', 'Back bumper', 'Front bumper left', 'Front bumper right',
  'Back bumper left', 'Back bumper right', 'Running board left', 'Running board right',
  'Back tyre left', 'Front tyre left', 'Front tyre right', 'Back tyre right',
  'Wheel cap back left', 'Wheel cap front right', 'Wheel cap front left', 'Wheel cap back right',
  'Right fender', 'Left fender', 'Door back right', 'Door front left', 'Door back left',
  'Door front right', 'Window front left', 'Window back left', 'Window front right',
  'Window back right', 'Backlight right', 'Backlight left',
] as const;

export type PartCondition = 'GOOD' | 'SCRATCH' | 'DENT' | 'BROKEN';

export const PART_CONDITIONS: { value: PartCondition; label: string; dot: string; chip: string }[] = [
  { value: 'GOOD',    label: 'Good',    dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'SCRATCH', label: 'Scratch', dot: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'DENT',    label: 'Dent',    dot: 'bg-orange-500',  chip: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'BROKEN',  label: 'Broken',  dot: 'bg-red-500',     chip: 'bg-red-100 text-red-700 border-red-200' },
];

export const conditionMeta = (c?: string) =>
  PART_CONDITIONS.find((x) => x.value === c) || PART_CONDITIONS[0];

export interface InspectionSide {
  parts: Record<string, PartCondition>;
  photos: string[];
  notes: string;
}

export interface Inspection {
  before: InspectionSide;
  after: InspectionSide;
}

export const emptySide = (): InspectionSide => ({ parts: {}, photos: [], notes: '' });
export const emptyInspection = (): Inspection => ({ before: emptySide(), after: emptySide() });
