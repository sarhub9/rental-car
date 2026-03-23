'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${SIZE_MAP[size]} rounded-full border-[#CBD5E1] border-t-[#0E7490] animate-spin`}
      />
      {message && <p className="text-sm text-[#64748B] font-medium">{message}</p>}
    </div>
  );
}
