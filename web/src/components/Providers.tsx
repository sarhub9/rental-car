'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#F8FAFC',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#F8FAFC',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
