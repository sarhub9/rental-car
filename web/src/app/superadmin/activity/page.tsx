'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { listCompanies } from '@/services/company.service';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2, HiOutlineLightBulb,
  HiOutlineCreditCard, HiOutlineSparkles, HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';

const EVENT_CFG: Record<string, { label: string; icon: any; iconBg: string; iconColor: string; badge: string; badgeText: string }> = {
  COMPANY_JOINED:      { label: 'New company joined the platform', icon: HiOutlineBuildingOffice2, iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700',    badgeText: 'New Registration' },
  TRIAL_STARTED:       { label: 'Trial period started',            icon: HiOutlineSparkles,        iconBg: 'bg-yellow-100',  iconColor: 'text-yellow-600',  badge: 'bg-yellow-50 text-yellow-700',  badgeText: 'Trial Started' },
  PLAN_ACTIVATED:      { label: 'Activated a subscription plan',   icon: HiOutlineCreditCard,      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700', badgeText: 'Plan Activated' },
  FEATURE_REQUEST:     { label: 'Submitted a feature request',     icon: HiOutlineLightBulb,       iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  badge: 'bg-orange-50 text-orange-700',  badgeText: 'Feature Request' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs  > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function groupByDate(events: any[]) {
  const groups: Record<string, any[]> = {};
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  for (const e of events) {
    const ds = new Date(e.created_at).toDateString();
    const key = ds === today ? 'Today' : ds === yesterday ? 'Yesterday'
      : new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    (groups[key] = groups[key] || []).push(e);
  }
  return groups;
}

const DAY_OPTS = [{ label: '7d', value: 7 }, { label: '14d', value: 14 }, { label: '30d', value: 30 }];
const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'New Companies', value: 'COMPANY_JOINED' },
  { label: 'Trials', value: 'TRIAL_STARTED' },
  { label: 'Plans', value: 'PLAN_ACTIVATED' },
  { label: 'Feature Requests', value: 'FEATURE_REQUEST' },
];

export default function ActivityPage() {
  const [events, setEvents]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState(30);
  const [typeFilter, setTypeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceISO = since.toISOString();

      // Fetch companies using the same service as companies page (guaranteed to work)
      const [companiesResult, featureReqRes] = await Promise.allSettled([
        listCompanies({ limit: 200 }),
        apiClient.get('/v1/feature-requests', { params: { limit: 200 } }),
      ]);

      const combined: any[] = [];

      // Process companies
      if (companiesResult.status === 'fulfilled') {
        const list: any[] = companiesResult.value.items || [];
        for (const c of list) {
          const createdAt = new Date(c.created_at);
          if (createdAt >= since) {
            // Company joined event
            combined.push({
              id: `join-${c.id}`,
              event_type: 'COMPANY_JOINED',
              name: c.name || c.company_name,
              contact_email: c.contact_email,
              detail: null,
              created_at: c.created_at,
            });
            // Trial started event (slightly after join)
            if (c.status === 'TRIAL' || c.trial_ends_at) {
              combined.push({
                id: `trial-${c.id}`,
                event_type: 'TRIAL_STARTED',
                name: c.name || c.company_name,
                contact_email: c.contact_email,
                detail: c.trial_ends_at
                  ? `Trial ends ${new Date(c.trial_ends_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  : null,
                created_at: c.created_at,
              });
            }
          }
        }
      }

      // Process feature requests
      if (featureReqRes.status === 'fulfilled') {
        const raw = featureReqRes.value.data;
        const list: any[] = Array.isArray(raw) ? raw : (raw?.data || []);
        for (const r of list) {
          if (new Date(r.created_at) >= since) {
            combined.push({
              id: `fr-${r.id}`,
              event_type: 'FEATURE_REQUEST',
              name: r.company_name || 'Unknown Company',
              contact_email: r.contact_email,
              detail: r.feature_title,
              created_at: r.created_at,
            });
          }
        }
      }

      // Sort by date descending
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEvents(combined);
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const filtered = typeFilter ? events.filter(e => e.event_type === typeFilter) : events;
  const grouped  = groupByDate(filtered);

  const stats = {
    newCompanies:  events.filter(e => e.event_type === 'COMPANY_JOINED').length,
    trials:        events.filter(e => e.event_type === 'TRIAL_STARTED').length,
    plans:         events.filter(e => e.event_type === 'PLAN_ACTIVATED').length,
    featureReqs:   events.filter(e => e.event_type === 'FEATURE_REQUEST').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} events in the selected period</p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-shrink-0">
            {DAY_OPTS.map(opt => (
              <button key={opt.value} onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  days === opt.value ? 'bg-[#0E7490] text-white' : 'text-gray-500 hover:text-gray-800'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Companies',    value: stats.newCompanies,  Icon: HiOutlineBuildingOffice2, bg: 'bg-blue-50',    color: 'text-blue-600' },
            { label: 'Trials Started',   value: stats.trials,        Icon: HiOutlineSparkles,        bg: 'bg-yellow-50',  color: 'text-yellow-600' },
            { label: 'Plans Activated',  value: stats.plans,         Icon: HiOutlineCreditCard,      bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Feature Requests', value: stats.featureReqs,   Icon: HiOutlineLightBulb,       bg: 'bg-orange-50',  color: 'text-orange-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2`}>
                <card.Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Timeline card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Type filter */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
            {TYPE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === f.value
                    ? 'bg-[#0E7490] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#0E7490] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <HiOutlineClipboardDocumentList className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-500">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Events will appear as companies use the platform</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(grouped).map(([date, evs]) => (
                <div key={date}>
                  <div className="px-5 py-2 bg-gray-50/80">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{date}</p>
                  </div>
                  {evs.map((ev) => {
                    const cfg = EVENT_CFG[ev.event_type] ?? {
                      label: ev.event_type, icon: HiOutlineClipboardDocumentList,
                      iconBg: 'bg-gray-100', iconColor: 'text-gray-500',
                      badge: 'bg-gray-100 text-gray-600', badgeText: ev.event_type,
                    };
                    const Icon = cfg.icon;
                    return (
                      <div key={ev.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconBg}`}>
                          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{ev.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
                              {cfg.badgeText}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {cfg.label}
                            {ev.detail && <span className="text-gray-700 font-medium"> — {ev.detail}</span>}
                          </p>
                          {ev.contact_email && (
                            <p className="text-xs text-gray-400 mt-0.5">{ev.contact_email}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-semibold text-gray-500">{timeAgo(ev.created_at)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(ev.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
