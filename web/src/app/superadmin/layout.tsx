'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineBuildingOffice2, HiOutlineLightBulb,
  HiOutlineCog6Tooth, HiOutlineClipboardDocumentList,
  HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark,
  HiOutlineShieldCheck, HiOutlineChartBarSquare, HiOutlineTag,
} from 'react-icons/hi2';

const NAV = [
  { label: 'Dashboard', href: '/superadmin', icon: HiOutlineHome },
  { label: 'Companies', href: '/superadmin/companies', icon: HiOutlineBuildingOffice2 },
  { label: 'Plans', href: '/superadmin/plans', icon: HiOutlineTag },
  { label: 'Feature Requests', href: '/superadmin/feature-requests', icon: HiOutlineLightBulb },
  { label: 'Activity Log', href: '/superadmin/activity', icon: HiOutlineClipboardDocumentList },
  { label: 'Settings', href: '/superadmin/settings', icon: HiOutlineCog6Tooth },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === '/superadmin/login';

  // Apply saved theme on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('superadmin_settings_local') || '{}');
      if (saved?.theme?.primary_color) document.documentElement.style.setProperty('--sa-primary', saved.theme.primary_color);
      if (saved?.theme?.sidebar_color) document.documentElement.style.setProperty('--sa-sidebar', saved.theme.sidebar_color);
    } catch {}
  }, []);

  useEffect(() => {
    if (isLoginPage) return;
    if (!isLoading && !isAuthenticated) {
      router.replace('/superadmin/login');
      return;
    }
    if (!isLoading && isAuthenticated && user?.role !== 'SUPER_ADMIN') {
      router.replace('/superadmin/login');
    }
  }, [isAuthenticated, isLoading, user, router, isLoginPage]);

  // Login page renders without sidebar
  if (isLoginPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0E7490] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') return null;

  const isActive = (href: string) =>
    href === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(href);

  const sidebar = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}>
          <HiOutlineShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">Drivebx ERP</p>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              style={active ? { backgroundColor: 'var(--sa-primary, #0E7490)' } : {}}>
              <span className={active ? 'text-white' : 'text-slate-400'}>
                <Icon className="w-5 h-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 px-4 py-4 space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
          <HiOutlineArrowRightOnRectangle className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}>
        <HiOutlineBars3 className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <HiOutlineXMark className="w-5 h-5" />
        </button>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0">
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
