'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiArrowUpTray, HiXMark, HiCheck } from 'react-icons/hi2';
import { uploadService } from '@/services/upload.service';
import { extractApiError } from '@/lib/api-error';
import {
  VEHICLE_PARTS, PART_CONDITIONS, conditionMeta, emptyInspection,
  type Inspection, type InspectionSide, type PartCondition,
} from '@/lib/vehicle-parts';

/** Multi-photo uploader: uploads immediately and returns the URL list. */
function PhotoUploader({ photos, onChange, label }: { photos: string[]; onChange: (p: string[]) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const res = await uploadService.uploadDocument(file, 'agreement-inspection', label);
        if (res.url) uploaded.push(res.url);
      }
      onChange([...photos, ...uploaded]);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Photo upload failed'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 p-0.5 rounded-md bg-white/90 text-red-500 shadow hover:bg-white"
            >
              <HiXMark className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-60"
        >
          {busy ? (
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <>
              <HiArrowUpTray className="w-5 h-5" />
              <span className="text-[10px] font-medium">Add</span>
            </>
          )}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

function SideEditor({ title, accent, side, onChange }: {
  title: string; accent: string; side: InspectionSide; onChange: (s: InspectionSide) => void;
}) {
  const damaged = VEHICLE_PARTS.filter((p) => side.parts[p] && side.parts[p] !== 'GOOD').length;

  const setAll = (cond: PartCondition) => {
    const parts: Record<string, PartCondition> = {};
    VEHICLE_PARTS.forEach((p) => { parts[p] = cond; });
    onChange({ ...side, parts });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-2.5 ${accent}`}>
        <p className="text-sm font-bold">{title}</p>
        <span className="text-xs font-medium">
          {damaged > 0 ? `${damaged} marked` : 'All good'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Photos */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Photos</p>
          <PhotoUploader photos={side.photos} onChange={(photos) => onChange({ ...side, photos })} label={title.toUpperCase()} />
        </div>

        {/* Parts checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parts Condition</p>
            <button type="button" onClick={() => setAll('GOOD')} className="text-[11px] text-blue-600 hover:underline">
              Mark all good
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
            {VEHICLE_PARTS.map((part) => {
              const cond = side.parts[part] || 'GOOD';
              const meta = conditionMeta(cond);
              return (
                <div key={part} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="flex items-center gap-2 text-xs text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                    {part}
                  </span>
                  <select
                    value={cond}
                    onChange={(e) => onChange({ ...side, parts: { ...side.parts, [part]: e.target.value as PartCondition } })}
                    className={`text-[11px] font-medium rounded-md border px-2 py-1 focus:outline-none ${meta.chip}`}
                  >
                    {PART_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes / Remarks</p>
          <textarea
            value={side.notes}
            onChange={(e) => onChange({ ...side, notes: e.target.value })}
            rows={2}
            placeholder="e.g. Perfect condition, fit to drive"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function VehicleInspection({ value, onSave }: {
  value: Inspection | null;
  onSave: (inspection: Inspection) => Promise<void>;
}) {
  const [inspection, setInspection] = useState<Inspection>(() => ({
    ...emptyInspection(),
    ...(value || {}),
    before: { ...emptyInspection().before, ...(value?.before || {}) },
    after: { ...emptyInspection().after, ...(value?.after || {}) },
  }));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(inspection);
      toast.success('Inspection saved');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save inspection'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Vehicle Inspection</h3>
          <p className="text-xs text-gray-500">Mark each part&apos;s condition and attach photos for handover (before) and return (after).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <HiCheck className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Inspection'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SideEditor
          title="Before (Checkout)"
          accent="bg-blue-50 text-blue-700"
          side={inspection.before}
          onChange={(before) => setInspection((p) => ({ ...p, before }))}
        />
        <SideEditor
          title="After (Return)"
          accent="bg-emerald-50 text-emerald-700"
          side={inspection.after}
          onChange={(after) => setInspection((p) => ({ ...p, after }))}
        />
      </div>
    </div>
  );
}
