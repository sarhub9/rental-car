'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiPlus, HiXMark, HiPencilSquare, HiChevronRight,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { vehicleCategoryService } from '@/services/vehicle-category.service';
import { extractApiError } from '@/lib/api-error';

const emptyForm = {
  category_name: '',
  category_code: '',
  daily_rate_default: '',
  weekly_rate_default: '',
};

function Field({ label, name, value, onChange, disabled, type = 'text', placeholder = '', required = false, mono = false }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
        className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 bg-white transition-colors ${mono ? 'font-mono' : ''}`} />
    </div>
  );
}

function CategoryDrawer({ open, onClose, category, onSaved }: {
  open: boolean; onClose: () => void; category: any | null; onSaved: () => void;
}) {
  const isEdit = !!category;
  const [readOnly, setReadOnly] = useState(isEdit);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setReadOnly(isEdit);
      if (category) {
        setForm({
          category_name: category.category_name || '',
          category_code: category.category_code || '',
          daily_rate_default: category.daily_rate_default != null ? String(category.daily_rate_default) : '',
          weekly_rate_default: category.weekly_rate_default != null ? String(category.weekly_rate_default) : '',
        });
      } else {
        setForm({ ...emptyForm });
      }
    }
  }, [open, category, isEdit]);

  const hi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === 'category_code' ? value.toUpperCase() : value }));
  };

  const handleSave = async () => {
    if (!form.category_name.trim()) { toast.error('Category name is required'); return; }
    if (!form.category_code.trim()) { toast.error('Category code is required'); return; }
    setSaving(true);
    try {
      const payload = {
        category_name: form.category_name,
        category_code: form.category_code.toUpperCase(),
        daily_rate_default: form.daily_rate_default ? Number(form.daily_rate_default) : undefined,
        weekly_rate_default: form.weekly_rate_default ? Number(form.weekly_rate_default) : undefined,
      };
      if (isEdit && category) {
        await vehicleCategoryService.updateVehicleCategory(category.id, payload);
        toast.success('Category updated');
      } else {
        await vehicleCategoryService.createVehicleCategory(payload);
        toast.success('Category created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to save category'));
    } finally {
      setSaving(false); }
  };

  const ro = readOnly;

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineSquares2X2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Category Details' : 'Add Category'}</h2>
              {isEdit && category && <p className="text-xs text-gray-500 font-mono">{category.category_code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Category Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Category Name" name="category_name" value={form.category_name} onChange={hi} disabled={ro} required placeholder="e.g. Economy, SUV, Luxury" />
              </div>
              <div className="col-span-2">
                <Field label="Category Code" name="category_code" value={form.category_code} onChange={hi} disabled={ro} required placeholder="e.g. ECO, SUV" mono />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Default Rates (AED)</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Daily Rate" name="daily_rate_default" value={form.daily_rate_default} onChange={hi} disabled={ro} type="number" placeholder="0.00" />
              <Field label="Weekly Rate" name="weekly_rate_default" value={form.weekly_rate_default} onChange={hi} disabled={ro} type="number" placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isEdit && ro ? (
            <button onClick={() => setReadOnly(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
              <HiPencilSquare className="w-4 h-4" /> Edit Category
            </button>
          ) : (
            <div className="flex gap-3">
              {isEdit && (
                <button onClick={() => setReadOnly(true)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function VehicleCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected]     = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleCategoryService.listVehicleCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load categories'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = categories.filter(c =>
    !search ||
    c.category_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length > 0 ? `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}` : 'Manage vehicle types and default rates'}
          </p>
        </div>
        <button onClick={() => { setSelected(null); setDrawerOpen(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineSquares2X2 className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No categories found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first vehicle category to get started</p>
            <button onClick={() => { setSelected(null); setDrawerOpen(true); }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Rate</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Weekly Rate</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicles</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c, i) => (
                <tr key={c.id} onClick={() => { setSelected(c); setDrawerOpen(true); }}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  <td className="px-5 py-4 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {c.category_code?.charAt(0) || 'C'}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{c.category_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{c.category_code || '—'}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {c.daily_rate_default != null ? `AED ${Number(c.daily_rate_default).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {c.weekly_rate_default != null ? `AED ${Number(c.weekly_rate_default).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{c.vehicle_count ?? '—'}</td>
                  <td className="px-5 py-4">
                    <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={selected}
        onSaved={load}
      />
    </div>
  );
}
