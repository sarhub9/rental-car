'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

export default function CreateDisputePage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    agreement_id: '',
    subject: '',
    description: '',
  });

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const res = await customerPortalService.getCustomerAgreements({ limit: 100 });
      setAgreements(res.data?.data || res.data || []);
    } catch (err: any) {
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.agreement_id) {
      toast.error('Please select an agreement');
      return;
    }
    if (!form.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setSubmitting(true);
      await customerPortalService.createDispute({
        agreement_id: form.agreement_id,
        subject: form.subject.trim(),
        description: form.description.trim(),
      });
      toast.success('Dispute raised successfully');
      router.push('/portal/disputes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/disputes')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raise a Dispute</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit a dispute related to one of your rental agreements.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          {/* Agreement Select */}
          <div>
            <label
              htmlFor="agreement_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Agreement <span className="text-red-500">*</span>
            </label>
            <select
              id="agreement_id"
              name="agreement_id"
              value={form.agreement_id}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select an agreement</option>
              {agreements.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.agreement_number} &mdash; {ag.vehicle_make} {ag.vehicle_model}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Brief summary of the issue"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/portal/disputes')}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
