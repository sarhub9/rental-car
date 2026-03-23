'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

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
      setDispute(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load dispute');
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
      toast.success('Message sent');
      await fetchDispute();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
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
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Dispute not found.</p>
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <button
          onClick={() => router.push('/portal/disputes')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {dispute.dispute_number || `Dispute #${dispute.id}`}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                dispute.status
              )}`}
            >
              {dispute.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500">{dispute.subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Initial description */}
        <div className="flex justify-end">
          <div className="max-w-[75%]">
            <div className="bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-sm">{dispute.description}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {new Date(dispute.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {messages.map((msg: any, idx: number) => {
          const isCustomer =
            msg.sender_type === 'customer' || msg.is_customer || msg.role === 'customer';

          return (
            <div
              key={idx}
              className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isCustomer
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  }`}
                >
                  {!isCustomer && msg.sender_name && (
                    <p className="text-xs font-semibold mb-1 text-gray-600">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm">{msg.message || msg.content}</p>
                </div>
                <p
                  className={`text-xs text-gray-400 mt-1 ${
                    isCustomer ? 'text-right' : 'text-left'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-end gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
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
