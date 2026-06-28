'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiXMark, HiCheckCircle, HiPencilSquare, HiTrash } from 'react-icons/hi2';
import { uploadService } from '@/services/upload.service';
import { extractApiError } from '@/lib/api-error';

interface SignaturePadProps {
  label: string;
  /** current stored signature URL / preview (empty string if none) */
  value: string;
  /** called with the new URL after a successful upload, or '' when cleared */
  onChange: (url: string) => void;
  /**
   * Optional "file mode": when provided, the drawn signature is NOT uploaded.
   * Instead the raw PNG File + a data-URL preview are returned to the caller
   * (e.g. to append to a multipart form). `category`/`docKey` become optional.
   */
  onCapture?: (file: File, dataUrl: string) => void;
  /** folder/category for storage, e.g. "agreement-signatures" (upload mode) */
  category?: string;
  /** short document label, e.g. "SIGNATURE" (upload mode) */
  docKey?: string;
  required?: boolean;
}

/**
 * SignaturePad — capture a hand-drawn signature in a popup (mouse / finger /
 * stylus), then upload it as a PNG. Drop-in replacement for DocumentUpload.
 */
export function SignaturePad({ label, value, onChange, onCapture, category, docKey, required }: SignaturePadProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  // Locally captured PNG data-URL, shown immediately after signing so the
  // preview never depends on the freshly-uploaded server URL loading in time.
  const [localPreview, setLocalPreview] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // White background so the exported PNG isn't transparent.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  useEffect(() => {
    if (open) {
      // Defer so the canvas exists in the DOM.
      setTimeout(prepareCanvas, 0);
      setHasDrawn(false);
    }
  }, [open, prepareCanvas]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pointFromEvent(e);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    prepareCanvas();
    setHasDrawn(false);
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasDrawn) {
      toast.error('Please sign before saving');
      return;
    }
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      toast.error('Could not capture signature');
      return;
    }
    const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });
    const dataUrl = canvas.toDataURL('image/png');

    // File mode — hand the File + preview back to the caller, no upload.
    if (onCapture) {
      onCapture(file, dataUrl);
      setOpen(false);
      return;
    }

    try {
      setUploading(true);
      const res = await uploadService.uploadDocument(file, category || 'signatures', docKey || 'SIGNATURE');
      setLocalPreview(dataUrl); // show immediately, independent of server URL load
      onChange(res.url);
      toast.success('Signature saved');
      setOpen(false);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save signature'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {(localPreview || value) ? (
        <div className="relative group rounded-lg border border-gray-300 overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={localPreview || value} alt={label} className="w-full h-36 object-contain bg-white" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" onClick={() => setOpen(true)}
              className="px-2 py-1 rounded-md bg-white/90 text-xs font-medium text-gray-700 shadow hover:bg-white">
              Re-sign
            </button>
            <button type="button" onClick={() => { setLocalPreview(''); onChange(''); }}
              className="p-1 rounded-md bg-white/90 text-red-500 shadow hover:bg-white">
              <HiXMark className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-medium">
            <HiCheckCircle className="w-3.5 h-3.5" /> Signed
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-36 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 transition-all"
        >
          <HiPencilSquare className="w-6 h-6" />
          <span className="text-xs font-medium">Click to sign here</span>
          <span className="text-[10px] text-gray-400">Draw with mouse, finger or stylus</span>
        </button>
      )}

      {/* Signature popup */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !uploading && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <HiPencilSquare className="h-5 w-5" /> {label}
              </h3>
              <button onClick={() => !uploading && setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <HiXMark className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-2">Draw your signature in the box below.</p>
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full h-55 rounded-lg border-2 border-gray-300 bg-white touch-none cursor-crosshair"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={clear}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <HiTrash className="h-4 w-4" /> Clear
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Saving...' : 'Save Signature'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignaturePad;
