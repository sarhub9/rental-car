'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newThread, setNewThread] = useState({ subject: '', message: '' });

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerMessages();
      setThreads(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load messages'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThread.subject.trim()) { toast.error('Please enter a subject'); return; }
    if (!newThread.message.trim()) { toast.error('Please enter a message'); return; }
    try {
      setCreating(true);
      await customerPortalService.createMessage({
        subject: newThread.subject.trim(),
        message_text: newThread.message.trim(),
      });
      toast.success('Message sent');
      setShowModal(false);
      setNewThread({ subject: '', message: '' });
      await fetchThreads();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to send message'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">Communicate with our support team.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <HiOutlinePlus className="h-4 w-4" />
          New Message
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mx-auto">
            <HiOutlineChatBubbleLeftRight className="h-7 w-7 text-primary-500" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">No messages yet.</p>
          <p className="mt-1 text-xs text-gray-400">Send a message to get support from our team.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Start a conversation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {threads.map((thread) => {
            const isClosed = thread.status === 'CLOSED' || thread.status === 'closed';
            return (
              <div
                key={thread.id}
                onClick={() => router.push(`/portal/messages/${thread.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isClosed ? 'bg-gray-100' : 'bg-primary-50'}`}>
                  <HiOutlineChatBubbleLeftRight className={`h-5 w-5 ${isClosed ? 'text-gray-400' : 'text-primary-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${thread.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {thread.subject}
                    </p>
                    {thread.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {thread.last_message || thread.preview || 'No messages yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isClosed && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <HiOutlineLockClosed className="h-3 w-3" />
                      Closed
                    </span>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(thread.last_message_at || thread.updated_at || thread.created_at).toLocaleDateString()}
                  </p>
                  <HiOutlineArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <HiOutlineChatBubbleLeftRight className="h-4 w-4 text-primary-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">New Message</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label htmlFor="thread-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="thread-subject"
                  type="text"
                  value={newThread.subject}
                  onChange={(e) => setNewThread((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="What is this about?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label htmlFor="thread-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="thread-message"
                  value={newThread.message}
                  onChange={(e) => setNewThread((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
