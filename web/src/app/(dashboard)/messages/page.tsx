'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { extractApiError } from '@/lib/api-error';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');

  useEffect(() => {
    fetchThreads();
  }, [filter]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') params.status = filter.toUpperCase();
      const res = await apiClient.get('/v1/messages', { params });
      const data = res.data.data || res.data;
      setThreads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load messages'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/v1/messages/${id}/close`);
      setThreads((prev) => prev.map((t) => t.id === id ? { ...t, status: 'CLOSED' } : t));
      toast.success('Thread closed');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to close thread'));
    }
  };

  const handleReopen = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/v1/messages/${id}/reopen`);
      setThreads((prev) => prev.map((t) => t.id === id ? { ...t, status: 'OPEN' } : t));
      toast.success('Thread reopened');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to reopen thread'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Messages sent by customers from their portal.
          </p>
        </div>
        <div className="flex gap-2">
          {(['open', 'closed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineChatBubbleLeftRight className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No {filter !== 'all' ? filter : ''} message threads.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => router.push(`/messages/${thread.id}`)}
              className="flex items-start justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-semibold truncate ${thread.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {thread.subject}
                  </p>
                  {thread.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                      {thread.unread_count}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    thread.status === 'CLOSED' || thread.status === 'closed'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {thread.status?.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {thread.customer_name || thread.customer_user_name || thread.customer_full_name || 'Customer'} &mdash; {thread.last_message || 'No messages yet'}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(thread.last_message_at || thread.updated_at || thread.created_at).toLocaleDateString()}
                </p>
                {thread.status !== 'CLOSED' && thread.status !== 'closed' ? (
                  <button
                    onClick={(e) => handleClose(thread.id, e)}
                    title="Close thread"
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleReopen(thread.id, e)}
                    title="Reopen thread"
                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                  >
                    <HiOutlineCheckCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
