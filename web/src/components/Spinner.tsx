'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function Spinner({ size = 'md', message }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-3 border-slate-200 border-t-cyan-700`}
      />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  );
}
