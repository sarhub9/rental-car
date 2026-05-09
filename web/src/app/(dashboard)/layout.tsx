'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Apply superadmin theme settings
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('superadmin_settings_local') || '{}');
      if (saved?.theme?.primary_color) document.documentElement.style.setProperty('--sa-primary', saved.theme.primary_color);
      if (saved?.theme?.sidebar_color) document.documentElement.style.setProperty('--sa-sidebar', saved.theme.sidebar_color);
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F1F5F9]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
