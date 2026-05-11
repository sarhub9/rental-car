'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineSquares2X2,
  HiOutlinePlusCircle,
} from 'react-icons/hi2';
import { vehicleCategoryService } from '@/services/vehicle-category.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const emptyForm = {
  category_name: '',
  category_code: '',
  daily_rate_default: '',
  weekly_rate_default: '',
};

export default function VehicleCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehicleCategoryService.listVehicleCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    if (!form.category_name.trim()) { toast.error('Category name is required'); return; }
    if (!form.category_code.trim()) { toast.error('Category code is required'); return; }
    try {
      setSubmitting(true);
      await vehicleCategoryService.createVehicleCategory({
        category_name: form.category_name,
        category_code: form.category_code.toUpperCase(),
        daily_rate_default: form.daily_rate_default ? Number(form.daily_rate_default) : undefined,
        weekly_rate_default: form.weekly_rate_default ? Number(form.weekly_rate_default) : undefined,
      });
      toast.success('Category created');
      setShowModal(false);
      setForm({ ...emptyForm });
      fetchCategories();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create category'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      render: (row: any) => <span className="font-medium text-gray-900">{row.category_name}</span>,
    },
    {
      header: 'Code',
      render: (row: any) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{row.category_code}</span>
      ),
    },
    {
      header: 'Daily Rate (AED)',
      render: (row: any) =>
        row.daily_rate_default != null ? `AED ${Number(row.daily_rate_default).toLocaleString()}` : '—',
    },
    {
      header: 'Weekly Rate (AED)',
      render: (row: any) =>
        row.weekly_rate_default != null ? `AED ${Number(row.weekly_rate_default).toLocaleString()}` : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <HiOutlineSquares2X2 className="h-5 w-5 text-violet-600" />
          </div>
          <PageHeader title="Vehicle Categories" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          emptyMessage="No vehicle categories yet. Add your first category."
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Vehicle Category">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Economy, SUV, Luxury"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.category_code}
                onChange={(e) => setForm({ ...form, category_code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="e.g. ECO, SUV"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Daily Rate (AED)</label>
              <input
                type="number"
                value={form.daily_rate_default}
                onChange={(e) => setForm({ ...form, daily_rate_default: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Weekly Rate (AED)</label>
              <input
                type="number"
                value={form.weekly_rate_default}
                onChange={(e) => setForm({ ...form, weekly_rate_default: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
