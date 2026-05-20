'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { extractApiError } from '@/lib/api-error';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminMessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchThread();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/v1/messages/${id}`);
      setThread(res.data.data || res.data);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load thread'));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      await apiClient.post(`/v1/messages/${id}/messages`, { message: message.trim() });
      setMessage('');
      await fetchThread();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    try {
      await apiClient.patch(`/v1/messages/${id}/close`);
      setThread((prev: any) => ({ ...prev, status: 'CLOSED' }));
      toast.success('Thread closed');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to close thread'));
    }
  };

  const handleReopen = async () => {
    try {
      await apiClient.patch(`/v1/messages/${id}/reopen`);
      setThread((prev: any) => ({ ...prev, status: 'OPEN' }));
      toast.success('Thread reopened');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to reopen thread'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Thread not found.</p>
        <button onClick={() => router.push('/messages')} className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
          Back to Messages
        </button>
      </div>
    );
  }

  const messages = thread.messages || [];
  const isClosed = thread.status === 'CLOSED' || thread.status === 'closed';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <button onClick={() => router.push('/messages')} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">{thread.subject}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isClosed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {thread.status?.toLowerCase()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            From: {thread.customer_name || thread.customer_full_name || 'Customer'} &bull; {new Date(thread.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isClosed ? (
            <button onClick={handleReopen} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <HiOutlineCheckCircle className="h-4 w-4" />
              Reopen
            </button>
          ) : (
            <button onClick={handleClose} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <HiOutlineXMark className="h-4 w-4" />
              Close Thread
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No messages yet.</p>
        ) : (
          messages.map((msg: any, idx: number) => {
            const isCustomer = msg.sender_role === 'RENTAL_CUSTOMER';
            return (
              <div key={idx} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[75%]">
                  <div className={`rounded-2xl px-4 py-3 ${isCustomer ? 'bg-gray-100 text-gray-900 rounded-tl-sm' : 'bg-primary-600 text-white rounded-tr-sm'}`}>
                    {isCustomer && (
                      <p className="text-xs font-semibold mb-1 text-gray-500">
                        {thread.customer_name || 'Customer'}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message_text || msg.message || msg.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isCustomer ? 'text-left' : 'text-right'}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      {!isClosed && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-end gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your reply..."
              rows={2}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="inline-flex items-center justify-center p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiOutlinePaperAirplane className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Press Enter to send</p>
        </div>
      )}
    </div>
  );
}
