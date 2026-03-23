'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

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
      setThreads(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThread.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!newThread.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

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
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Communicate with our support team.
          </p>
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
        <div className="text-center py-12">
          <HiOutlineChatBubbleLeftRight className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No message threads yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Start a conversation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => router.push(`/portal/messages/${thread.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        thread.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {thread.subject}
                    </p>
                    {thread.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {thread.last_message || thread.preview || 'No messages yet'}
                  </p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0 ml-4">
                  {new Date(
                    thread.last_message_at || thread.updated_at || thread.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="thread-subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="thread-subject"
                  type="text"
                  value={newThread.subject}
                  onChange={(e) =>
                    setNewThread((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="What is this about?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="thread-message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="thread-message"
                  value={newThread.message}
                  onChange={(e) =>
                    setNewThread((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
