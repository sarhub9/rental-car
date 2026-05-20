'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchThread();
      markRead();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [thread?.messages]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerMessageById(id);
      setThread(res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load thread'));
    } finally {
      setLoading(false);
    }
  };

  const markRead = async () => {
    try {
      await customerPortalService.markMessageAsRead(id);
    } catch {
      // silent
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      await customerPortalService.replyToMessage(id, message.trim());
      setMessage('');
      await fetchThread();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-600">Thread not found.</p>
        <button
          onClick={() => router.push('/portal/messages')}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  const messages = thread.messages || [];
  const isClosed = thread.status === 'CLOSED' || thread.status === 'closed';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/messages')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{thread.subject}</h1>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                <HiOutlineLockClosed className="h-3 w-3" />
                Closed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Started {new Date(thread.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 14rem)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-3">
                <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-primary-400" />
              </div>
              <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map((msg: any, idx: number) => {
              const isCustomer =
                msg.sender_type === 'RENTAL_CUSTOMER' ||
                msg.sender_type === 'customer' ||
                msg.is_customer ||
                msg.role === 'customer';

              return (
                <div key={idx} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[75%]">
                    {!isCustomer && msg.sender_name && (
                      <p className="text-xs font-semibold text-gray-500 mb-1 ml-1">{msg.sender_name}</p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isCustomer
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.message_text || msg.message || msg.content}
                      </p>
                    </div>
                    <p className={`text-xs text-gray-400 mt-1 ${isCustomer ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input or Closed notice */}
        {isClosed ? (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center gap-2 text-sm text-gray-500">
            <HiOutlineLockClosed className="h-4 w-4 flex-shrink-0" />
            This thread is closed and no longer accepts replies.
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send)"
                rows={2}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="inline-flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <HiOutlinePaperAirplane className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
