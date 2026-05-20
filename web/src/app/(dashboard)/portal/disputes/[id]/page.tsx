'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_STYLES: Record<string, { badge: string; dot: string }> = {
  open:        { badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  in_progress: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  'in progress':{ badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  resolved:    { badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  closed:      { badge: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchDispute();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [dispute?.messages]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerDisputeById(id);
      setDispute(res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load dispute'));
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSending(true);
      await customerPortalService.sendDisputeMessage(id, message.trim());
      setMessage('');
      await fetchDispute();
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

  if (!dispute) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-600">Dispute not found.</p>
        <button
          onClick={() => router.push('/portal/disputes')}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Disputes
        </button>
      </div>
    );
  }

  const messages = dispute.messages || [];
  const statusKey = dispute.status?.toLowerCase().replace('_', ' ') || 'open';
  const si = STATUS_STYLES[dispute.status?.toLowerCase()] || STATUS_STYLES.open;
  const isClosed = dispute.status === 'closed' || dispute.status === 'CLOSED';
  const isResolved = dispute.status === 'resolved' || dispute.status === 'RESOLVED';
  const isReadOnly = isClosed || isResolved;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/disputes')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {dispute.dispute_number || `Dispute #${dispute.id?.slice(0, 8)}`}
            </h1>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${si.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${si.dot}`} />
              {dispute.status?.replaceAll('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Raised {new Date(dispute.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Subject info card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamationTriangle className="h-4.5 w-4.5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{dispute.subject}</p>
            {dispute.agreement_number && (
              <p className="text-xs text-gray-500 mt-0.5">
                Agreement: {dispute.agreement_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 20rem)' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Initial description bubble */}
          <div className="flex justify-end">
            <div className="max-w-[75%]">
              <p className="text-xs font-semibold text-gray-500 mb-1 mr-1 text-right">You (initial report)</p>
              <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{dispute.description}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {new Date(dispute.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {messages.map((msg: any, idx: number) => {
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
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input or status notice */}
        {isReadOnly ? (
          <div className={`px-4 py-3 border-t border-gray-100 rounded-b-xl flex items-center gap-2 text-sm ${
            isResolved ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
          }`}>
            {isResolved ? (
              <>
                <HiOutlineCheckCircle className="h-4 w-4 flex-shrink-0" />
                This dispute has been resolved.
              </>
            ) : (
              <>
                <HiOutlineLockClosed className="h-4 w-4 flex-shrink-0" />
                This dispute is closed and no longer accepts replies.
              </>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a reply... (Enter to send)"
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
