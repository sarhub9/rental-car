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
  HiOutlineLightBulb,
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
    { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Users', href: '/admin/users', icon: <HiOutlineUserGroup size={20} /> },
    { label: 'Rate Plans', href: '/rate-plans', icon: <HiOutlineTag size={20} /> },
    { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
    { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'KPIs', href: '/admin/kpis', icon: <HiOutlineChartBar size={20} /> },
    { label: 'Reports', href: '/admin/reports', icon: <HiOutlineDocumentChartBar size={20} /> },
    // { label: 'Audit Log', href: '/admin/audit-log', icon: <HiOutlineShieldCheck size={20} /> }, // TODO: Create page
  ],
  OWNER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Users', href: '/admin/users', icon: <HiOutlineUserGroup size={20} /> },
    { label: 'Rate Plans', href: '/rate-plans', icon: <HiOutlineTag size={20} /> },
    { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
    { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'KPIs', href: '/admin/kpis', icon: <HiOutlineChartBar size={20} /> },
    { label: 'Reports', href: '/admin/reports', icon: <HiOutlineDocumentChartBar size={20} /> },
    // { label: 'Audit Log', href: '/admin/audit-log', icon: <HiOutlineShieldCheck size={20} /> }, // TODO: Create page
  ],
  FRONT_DESK: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Agreements', href: '/agreements', icon: <HiOutlineDocumentText size={20} /> },
    { label: 'Customers', href: '/customers', icon: <HiOutlineUsers size={20} /> },
    { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={20} /> },
  ],
  FLEET_MANAGER: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Vehicles', href: '/vehicles', icon: <HiOutlineTruck size={20} /> },
    { label: 'Maintenance', href: '/maintenance', icon: <HiOutlineWrenchScrewdriver size={20} /> },
  ],
  ACCOUNTS: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'Invoices', href: '/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Payments', href: '/accounts/payments', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Deposits', href: '/accounts/deposits', icon: <HiOutlineBanknotes size={20} /> },
    { label: 'Toll Fines', href: '/accounts/toll-fines', icon: <HiOutlineExclamationTriangle size={20} /> },
  ],
  DRIVER_RECOVERY: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'My Tasks', href: '/driver', icon: <HiOutlineClipboardDocumentCheck size={20} /> },
  ],
  RENTAL_CUSTOMER: [
    { label: 'Dashboard', href: '/dashboard', icon: <HiOutlineHome size={20} /> },
    { label: 'My Rentals', href: '/portal/rentals', icon: <HiOutlineClipboardDocumentList size={20} /> },
    { label: 'Invoices', href: '/portal/invoices', icon: <HiOutlineCurrencyDollar size={20} /> },
    { label: 'Disputes', href: '/portal/disputes', icon: <HiOutlineExclamationTriangle size={20} /> },
    { label: 'Messages', href: '/portal/messages', icon: <HiOutlineChatBubbleLeftRight size={20} /> },
    { label: 'Notifications', href: '/portal/notifications', icon: <HiOutlineBellAlert size={20} /> },
    { label: 'Profile', href: '/portal/profile', icon: <HiOutlineUserCircle size={20} /> },
  ],
};

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'FRONT_DESK';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.FRONT_DESK;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
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
      <div className="border-t border-white/10 px-4 py-4 space-y-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-[#0E7490] flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>

        <button
          onClick={() => setShowFeatureModal(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <HiOutlineLightBulb size={18} />
          Request Feature
        </button>

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

      {/* Feature Request Modal */}
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
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFeatureTitle('');
        setMessage('');
      }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineLightBulb size={22} className="text-[#0E7490]" />
            <h2 className="text-lg font-bold text-[#0F172A]">Request a Feature</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">Request Submitted!</p>
            <p className="text-xs text-[#64748B]">We'll review your suggestion and get back to you via email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name (auto-detected) */}
            {user?.tenant_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                  {user?.full_name ? `${user.full_name}'s Company` : 'Your Company'}
                </div>
              </div>
            )}

            {/* Feature Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feature Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                placeholder="e.g., Add SMS notifications for bookings"
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the feature you'd like to see and how it would help your business..."
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{message.length}/2000</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !featureTitle.trim() || !message.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0E7490] hover:bg-[#0C6680] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
