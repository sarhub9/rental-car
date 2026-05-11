'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createPortal } from 'react-dom';
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
  HiOutlineLightBulb,
  HiOutlineIdentification,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineArrowUturnLeft,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV_GROUPS_BY_ROLE: Record<string, NavGroup[]> = {
  SUPER_ADMIN: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={18} /> },
        { label: 'Reservations', href: '/reservations', icon: <HiOutlineCalendarDays size={18} /> },
        { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={18} /> },
        { label: 'Drivers', href: '/drivers', icon: <HiOutlineIdentification size={18} /> },
        { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={18} /> },
        { label: 'Incidents', href: '/incidents', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={18} /> },
        { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Refunds', href: '/accounts/refunds', icon: <HiOutlineArrowUturnLeft size={18} /> },
        { label: 'Cash Drawer', href: '/accounts/cash-drawer', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Branches', href: '/branches', icon: <HiOutlineBuildingOffice2 size={18} /> },
        { label: 'Corporate Accounts', href: '/corporate-accounts', icon: <HiOutlineBuildingOffice2 size={18} /> },
        { label: 'Users', href: '/admin/users', icon: <HiOutlineUserGroup size={18} /> },
        { label: 'Rate Plans', href: '/rate-plans', icon: <HiOutlineTag size={18} /> },
        { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={18} /> },
        { label: 'Work Orders', href: '/work-orders', icon: <HiOutlineClipboardDocumentList size={18} /> },
        { label: 'KPIs', href: '/admin/kpis', icon: <HiOutlineChartBar size={18} /> },
        { label: 'Reports', href: '/admin/reports', icon: <HiOutlineDocumentChartBar size={18} /> },
      ],
    },
    {
      title: 'Platform',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: <HiOutlineCog6Tooth size={18} /> },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: <HiOutlineClipboardDocumentList size={18} /> },
        { label: 'Super Admin', href: '/superadmin', icon: <HiOutlineShieldCheck size={18} /> },
      ],
    },
  ],
  OWNER_ADMIN: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={18} /> },
        { label: 'Reservations', href: '/reservations', icon: <HiOutlineCalendarDays size={18} /> },
        { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={18} /> },
        { label: 'Drivers', href: '/drivers', icon: <HiOutlineIdentification size={18} /> },
        { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={18} /> },
        { label: 'Incidents', href: '/incidents', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={18} /> },
        { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Refunds', href: '/accounts/refunds', icon: <HiOutlineArrowUturnLeft size={18} /> },
        { label: 'Cash Drawer', href: '/accounts/cash-drawer', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Branches', href: '/branches', icon: <HiOutlineBuildingOffice2 size={18} /> },
        { label: 'Corporate Accounts', href: '/corporate-accounts', icon: <HiOutlineBuildingOffice2 size={18} /> },
        { label: 'Users', href: '/admin/users', icon: <HiOutlineUserGroup size={18} /> },
        { label: 'Rate Plans', href: '/rate-plans', icon: <HiOutlineTag size={18} /> },
        { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={18} /> },
        { label: 'Work Orders', href: '/work-orders', icon: <HiOutlineClipboardDocumentList size={18} /> },
        { label: 'KPIs', href: '/admin/kpis', icon: <HiOutlineChartBar size={18} /> },
        { label: 'Reports', href: '/admin/reports', icon: <HiOutlineDocumentChartBar size={18} /> },
        { label: 'Settings', href: '/admin/settings', icon: <HiOutlineCog6Tooth size={18} /> },
        { label: 'Audit Logs', href: '/admin/audit-logs', icon: <HiOutlineClipboardDocumentList size={18} /> },
      ],
    },
  ],
  FRONT_DESK: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={18} /> },
        { label: 'Reservations', href: '/reservations', icon: <HiOutlineCalendarDays size={18} /> },
        { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={18} /> },
        { label: 'Drivers', href: '/drivers', icon: <HiOutlineIdentification size={18} /> },
        { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={18} /> },
        { label: 'Incidents', href: '/incidents', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Cash Drawer', href: '/accounts/cash-drawer', icon: <HiOutlineBanknotes size={18} /> },
      ],
    },
  ],
  FLEET_MANAGER: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'Fleet',
      items: [
        { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={18} /> },
        { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={18} /> },
        { label: 'Work Orders', href: '/work-orders', icon: <HiOutlineClipboardDocumentList size={18} /> },
        { label: 'Incidents', href: '/incidents', icon: <HiOutlineExclamationTriangle size={18} /> },
      ],
    },
  ],
  ACCOUNTS: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={18} /> },
        { label: 'Payments', href: '/accounts/payments', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Refunds', href: '/accounts/refunds', icon: <HiOutlineArrowUturnLeft size={18} /> },
        { label: 'Cash Drawer', href: '/accounts/cash-drawer', icon: <HiOutlineBanknotes size={18} /> },
        { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={18} /> },
        { label: 'Corporate Accounts', href: '/corporate-accounts', icon: <HiOutlineBuildingOffice2 size={18} /> },
      ],
    },
  ],
  DRIVER_RECOVERY: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
        { label: 'My Tasks', href: '/driver', icon: <HiOutlineClipboardDocumentCheck size={18} /> },
      ],
    },
  ],
  RENTAL_CUSTOMER: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={18} /> },
      ],
    },
    {
      title: 'My Account',
      items: [
        { label: 'My Rentals', href: '/portal/rentals', icon: <HiOutlineClipboardDocumentList size={18} /> },
        { label: 'Invoices', href: '/portal/invoices', icon: <HiOutlineCurrencyDollar size={18} /> },
        { label: 'Disputes', href: '/portal/disputes', icon: <HiOutlineExclamationTriangle size={18} /> },
        { label: 'Messages', href: '/portal/messages', icon: <HiOutlineChatBubbleLeftRight size={18} /> },
        { label: 'Notifications', href: '/portal/notifications', icon: <HiOutlineBellAlert size={18} /> },
        { label: 'Profile', href: '/portal/profile', icon: <HiOutlineUserCircle size={18} /> },
      ],
    },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER_ADMIN: 'Owner / Admin',
  FRONT_DESK: 'Front Desk',
  FLEET_MANAGER: 'Fleet Manager',
  ACCOUNTS: 'Accounts',
  DRIVER_RECOVERY: 'Driver',
  RENTAL_CUSTOMER: 'Customer',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-500/20 text-violet-300',
  OWNER_ADMIN: 'bg-sky-500/20 text-sky-300',
  FRONT_DESK: 'bg-teal-500/20 text-teal-300',
  FLEET_MANAGER: 'bg-orange-500/20 text-orange-300',
  ACCOUNTS: 'bg-emerald-500/20 text-emerald-300',
  DRIVER_RECOVERY: 'bg-yellow-500/20 text-yellow-300',
  RENTAL_CUSTOMER: 'bg-pink-500/20 text-pink-300',
};

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'FRONT_DESK';
  const navGroups = NAV_GROUPS_BY_ROLE[role] ?? NAV_GROUPS_BY_ROLE.FRONT_DESK;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}>

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}
        >
          <HiOutlineTruck size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white tracking-tight leading-none">Drivebx ERP</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Management Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.title && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative ${
                    active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? { backgroundColor: 'var(--sa-primary, #0E7490)' } : {}}
                >
                  {/* Left accent bar for active */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-white/60" />
                  )}
                  <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {/* User info card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: 'var(--sa-primary, #0E7490)' }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user?.full_name ?? 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
              {user?.email ?? ''}
            </p>
          </div>
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${ROLE_COLORS[role] ?? 'bg-slate-500/20 text-slate-300'}`}>
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>

        {/* Actions row */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowFeatureModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HiOutlineLightBulb size={15} />
            Suggest
          </button>
          <div className="w-px bg-white/10 my-1" />
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-colors"
          >
            <HiOutlineArrowRightOnRectangle size={15} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white shadow-lg"
        style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}
        aria-label="Open menu"
      >
        <HiOutlineBars3 size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <HiOutlineXMark size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0"
        style={{ backgroundColor: 'var(--sa-sidebar, #0F172A)' }}
      >
        {sidebarContent}
      </aside>

      {/* Feature Request Modal — portal to avoid stacking context issues */}
      {showFeatureModal && (
        <FeatureRequestModal onClose={() => setShowFeatureModal(false)} />
      )}
    </>
  );
}

// ============================================================================
// Feature Request Modal
// ============================================================================

function FeatureRequestModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [featureTitle, setFeatureTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const { submitFeatureRequest } = await import('@/services/company.service');
      await submitFeatureRequest({
        feature_title: featureTitle.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setTimeout(() => { onClose(); }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999, pointerEvents: 'none' }}>
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#0E7490]/10 text-[#0E7490] rounded-xl flex items-center justify-center">
                <HiOutlineLightBulb size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Request a Feature</h2>
                <p className="text-xs text-[#64748B]">We review every submission</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <HiOutlineXMark size={18} />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">Request Submitted!</p>
              <p className="text-xs text-[#64748B]">We'll review your suggestion and get back to you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Feature Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={featureTitle}
                  onChange={(e) => setFeatureTitle(e.target.value)}
                  placeholder="e.g., SMS notifications for bookings"
                  maxLength={200}
                  className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe how this feature would help your business..."
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-[#D1D5DB] rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none resize-none"
                  required
                />
                <p className="text-[11px] text-[#94A3B8] mt-1 text-right">{message.length}/2000</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-medium text-[#374151] bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !featureTitle.trim() || !message.trim()}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#0E7490] hover:bg-[#0C6680] disabled:opacity-60 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}
