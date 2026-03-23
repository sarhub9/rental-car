'use client';

import { useEffect } from 'react';
import { HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

const VARIANT_STYLES = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: 'bg-yellow-100 text-yellow-600',
    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  },
  default: {
    icon: 'bg-[#0E7490]/10 text-[#0E7490]',
    button: 'bg-[#0E7490] hover:bg-[#155E75] focus:ring-[#0E7490]',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
          aria-label="Close"
        >
          <HiOutlineXMark size={20} />
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${styles.icon}`}>
              <HiOutlineExclamationTriangle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#0F172A]">{title}</h3>
              <p className="mt-1.5 text-sm text-[#475569] leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-[#CBD5E1]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#CBD5E1] text-[#475569] bg-white hover:bg-[#F1F5F9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#CBD5E1]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
