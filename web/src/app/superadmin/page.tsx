'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { listCompanies } from '@/services/company.service';
import {
  HiOutlineBuildingOffice2, HiOutlineLightBulb, HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle,
  HiOutlineChartBarSquare, HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  pendingRequests: number;
  totalRequests: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalCompanies: 0, activeCompanies: 0, pendingRequests: 0, totalRequests: 0 });
  const [companies, setCompanies] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesRes, requestsRes] = await Promise.allSettled([
          listCompanies({ limit: 100 }),
          apiClient.get('/v1/feature-requests', { params: { limit: 100 } }),
        ]);

        const companiesList: any[] = companiesRes.status === 'fulfilled'
          ? (companiesRes.value.items || [])
          : [];
        const raw = requestsRes.status === 'fulfilled' ? requestsRes.value.data : null;
        const requestsList: any[] = Array.isArray(raw) ? raw : (raw?.data || []);

        setCompanies(companiesList.slice(0, 10));
        setRecentRequests(requestsList.slice(0, 5));
        setStats({
          totalCompanies: companiesList.length,
          activeCompanies: companiesList.filter((c: any) => c.status === 'ACTIVE').length,
          pendingRequests: requestsList.filter((r: any) => r.status === 'PENDING').length,
          totalRequests: requestsList.length,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: HiOutlineBuildingOffice2, color: 'text-blue-600', bg: 'bg-blue-50', href: '/superadmin/companies' },
    { label: 'Active Companies', value: stats.activeCompanies, icon: HiOutlineCheckCircle, color: 'text-green-600', bg: 'bg-green-50', href: '/superadmin/companies' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: HiOutlineClock, color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/superadmin/feature-requests' },
    { label: 'Total Requests', value: stats.totalRequests, icon: HiOutlineLightBulb, color: 'text-purple-600', bg: 'bg-purple-50', href: '/superadmin/feature-requests' },
  ];

  const QUICK_LINKS = [
    { label: 'Manage Companies', href: '/superadmin/companies', icon: HiOutlineBuildingOffice2, desc: 'View and manage all registered companies' },
    { label: 'Feature Requests', href: '/superadmin/feature-requests', icon: HiOutlineLightBulb, desc: 'Review and respond to feature requests' },
    { label: 'Activity Log', href: '/superadmin/activity', icon: HiOutlineClipboardDocumentList, desc: 'Last 30 days platform activity' },
    { label: 'Platform Settings', href: '/superadmin/settings', icon: HiOutlineCog6Tooth, desc: 'Feature flags and theme configuration' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">CarRental ERP — SaaS Management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" /> : card.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">{link.label}</p>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Feature Requests */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Feature Requests</h2>
            <Link href="/superadmin/feature-requests" className="text-xs text-violet-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineLightBulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No feature requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRequests.slice(0, 5).map((req: any) => (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{req.feature_title}</p>
                    {req.company_name && <p className="text-xs text-gray-400">{req.company_name}</p>}
                  </div>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Companies</h2>
            <Link href="/superadmin/companies" className="text-xs text-violet-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <HiOutlineBuildingOffice2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No companies registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Company</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Phone</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {companies.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                            {(c.company_name || c.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{c.company_name || c.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{c.contact_email}</td>
                      <td className="py-3 text-sm text-gray-500">{c.phone_number}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : c.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' : c.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
