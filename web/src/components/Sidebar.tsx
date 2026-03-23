'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineUserGroup,
  HiOutlineTag,
  HiOutlineWrenchScrewdriver,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
  HiOutlineChartBar,
  HiOutlineDocumentChartBar,
  HiOutlineClipboardDocumentList,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBellAlert,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Agreements', href: '/dashboard/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/dashboard/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/dashboard/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Invoices', href: '/dashboard/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Users', href: '/dashboard/users', icon: <HiOutlineUserGroup size={20} /> },
    { label: 'Rate Plans', href: '/dashboard/rate-plans', icon: <HiOutlineTag size={20} /> },
    { label: 'Maintenance', href: '/dashboard/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
    { label: 'Deposits', href: '/dashboard/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/dashboard/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'KPIs', href: '/dashboard/kpis', icon: <HiOutlineChartBar size={20} /> },
    { label: 'Reports', href: '/dashboard/reports', icon: <HiOutlineDocumentChartBar size={20} /> },
    { label: 'Audit Log', href: '/dashboard/audit-log', icon: <HiOutlineShieldCheck size={20} /> },
  ],
  OWNER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Agreements', href: '/dashboard/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/dashboard/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/dashboard/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Invoices', href: '/dashboard/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Users', href: '/dashboard/users', icon: <HiOutlineUserGroup size={20} /> },
    { label: 'Rate Plans', href: '/dashboard/rate-plans', icon: <HiOutlineTag size={20} /> },
    { label: 'Maintenance', href: '/dashboard/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
    { label: 'Deposits', href: '/dashboard/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/dashboard/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'KPIs', href: '/dashboard/kpis', icon: <HiOutlineChartBar size={20} /> },
    { label: 'Reports', href: '/dashboard/reports', icon: <HiOutlineDocumentChartBar size={20} /> },
    { label: 'Audit Log', href: '/dashboard/audit-log', icon: <HiOutlineShieldCheck size={20} /> },
  ],
  FRONT_DESK: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Agreements', href: '/dashboard/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/dashboard/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/dashboard/vehicles', icon: <HiOutlineTruck size={20} /> },
  ],
  FLEET_MANAGER: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Vehicles', href: '/dashboard/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Maintenance', href: '/dashboard/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
  ],
  ACCOUNTS: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Invoices', href: '/dashboard/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Payments', href: '/dashboard/payments', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Deposits', href: '/dashboard/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/dashboard/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
  ],
  DRIVER_RECOVERY: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'My Tasks', href: '/dashboard/tasks', icon: <HiOutlineClipboardDocumentCheck size={20} /> },
  ],
  RENTAL_CUSTOMER: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'My Rentals', href: '/dashboard/my-rentals', icon: <HiOutlineClipboardDocumentList size={20} /> },
    { label: 'Invoices', href: '/dashboard/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Disputes', href: '/dashboard/disputes', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'Messages', href: '/dashboard/messages', icon: <HiOutlineChatBubbleLeftRight size={20} /> },
    { label: 'Notifications', href: '/dashboard/notifications', icon: <HiOutlineBellAlert size={20} /> },
    { label: 'Profile', href: '/dashboard/profile', icon: <HiOutlineUserCircle size={20} /> },
  ],
};

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'FRONT_DESK';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.FRONT_DESK;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0E7490]">
          <HiOutlineTruck size={22} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">CarRental ERP</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0E7490] text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#0E7490] flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <HiOutlineArrowRightOnRectangle size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0F172A] text-white shadow-lg"
        aria-label="Open menu"
      >
        <HiOutlineBars3 size={24} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <HiOutlineXMark size={24} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0F172A]">
        {sidebarContent}
      </aside>
    </>
  );
}
