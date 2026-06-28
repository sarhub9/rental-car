'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiArrowUpTray, HiXMark, HiCheckCircle } from 'react-icons/hi2';
import { uploadService } from '@/services/upload.service';
import { extractApiError } from '@/lib/api-error';

interface DocumentUploadProps {
  label: string;
  /** current stored URL (empty string if none) */
  value: string;
  /** called with the new URL after a successful upload, or '' when cleared */
  onChange: (url: string) => void;
  /** folder/category for storage, e.g. "customer-docs" */
  category: string;
  /** short document label, e.g. "EMIRATES_ID_FRONT" */
  docKey: string;
  required?: boolean;
  /** view-only: show the image (or placeholder) without upload/replace/remove */
  readOnly?: boolean;
}

export function DocumentUpload({ label, value, onChange, category, docKey, required, readOnly }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    try {
      setUploading(true);
      const res = await uploadService.uploadDocument(file, category, docKey);
      onChange(res.url);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {readOnly ? (
        value ? (
          <div className="rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-36 object-cover" />
          </div>
        ) : (
          <div className="w-full h-36 flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
            Not uploaded
          </div>
        )
      ) : value ? (
        <div className="relative group rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="w-full h-36 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="px-2 py-1 rounded-md bg-white/90 text-xs font-medium text-gray-700 shadow hover:bg-white">
              Replace
            </button>
            <button type="button" onClick={() => onChange('')}
              className="p-1 rounded-md bg-white/90 text-red-500 shadow hover:bg-white">
              <HiXMark className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-medium">
            <HiCheckCircle className="w-3.5 h-3.5" /> Uploaded
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 transition-all disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <HiArrowUpTray className="w-6 h-6" />
              <span className="text-xs font-medium">Click to upload photo</span>
              <span className="text-[10px] text-gray-400">JPG / PNG · max 10MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default DocumentUpload;
