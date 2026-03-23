'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    (val: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    debouncedOnChange(val);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="relative w-full max-w-sm">
      <HiOutlineMagnifyingGlass
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
      />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0E7490]/30 focus:border-[#0E7490] transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors"
          aria-label="Clear search"
        >
          <HiOutlineXMark size={18} />
        </button>
      )}
    </div>
  );
}
