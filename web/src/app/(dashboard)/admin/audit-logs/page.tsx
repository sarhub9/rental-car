'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';
import { adminSettingsService } from '@/services/admin-settings.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const LIMIT = 50;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Applied filters (only update on Apply click)
  const [appliedFilters, setAppliedFilters] = useState({
    event_type: '',
    start_date: '',
    end_date: '',
  });

  const fetchLogs = useCallback(async (currentOffset = 0, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params: Record<string, any> = { limit: LIMIT, offset: currentOffset };
      if (appliedFilters.event_type) params.event_type = appliedFilters.event_type;
      if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
      if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;

      const res = await adminSettingsService.listAuditLogs(params);
      const items = Array.isArray(res) ? res : (res?.data || []);

      if (append) {
        setLogs((prev) => [...prev, ...items]);
      } else {
        setLogs(items);
        setOffset(0);
      }
      setHasMore(items.length === LIMIT);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [appliedFilters]);

  useEffect(() => { fetchLogs(0, false); }, [fetchLogs]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      event_type: eventTypeFilter,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchLogs(newOffset, true);
  };

  const handleExport = () => {
    toast('Export feature — use the audit-logs API endpoint with export=csv parameter.', { icon: 'ℹ️' });
  };

  const columns = [
    {
      header: 'Event Type',
      render: (row: any) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          {row.event_type ?? '—'}
        </span>
      ),
    },
    {
      header: 'User',
      render: (row: any) =>
        row.user?.full_name ?? row.user_name ?? row.user?.email ?? row.user_id?.slice(0, 8) ?? '—',
    },
    {
      header: 'Description',
      render: (row: any) => {
        const desc = row.description ?? row.details ?? row.message ?? '';
        return (
          <span className="text-sm text-gray-600" title={desc}>
            {desc.length > 80 ? `${desc.slice(0, 80)}…` : desc}
          </span>
        );
      },
    },
    {
      header: 'IP Address',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-500">{row.ip_address ?? '—'}</span>
      ),
    },
    {
      header: 'Timestamp',
      render: (row: any) =>
        row.created_at
          ? new Date(row.created_at).toLocaleString()
          : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <HiOutlineClipboardDocumentList className="h-5 w-5 text-slate-600" />
          </div>
          <PageHeader title="Audit Logs" />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <HiOutlineArrowDownTray className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400 self-center" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Event Type</label>
          <input
            type="text"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44"
            placeholder="e.g. LOGIN, CREATE"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        {(appliedFilters.event_type || appliedFilters.start_date || appliedFilters.end_date) && (
          <button
            onClick={() => {
              setEventTypeFilter('');
              setStartDate('');
              setEndDate('');
              setAppliedFilters({ event_type: '', start_date: '', end_date: '' });
            }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            emptyMessage="No audit logs found."
          />
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore && <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">
            Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}
