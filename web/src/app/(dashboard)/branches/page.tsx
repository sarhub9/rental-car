'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight, HiXMark, HiOutlinePencilSquare, HiCheck,
  HiOutlineNoSymbol,
} from 'react-icons/hi2';
import { branchService } from '@/services/branch.service';
import { extractApiError } from '@/lib/api-error';
import { cleanPayload } from '@/lib/clean-payload';

function SH({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">{title}</p>;
}

function DRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

const emptyForm = { branch_name: '', branch_code: '', phone: '', email: '', address: '' };

function BranchDrawer({ branch, onClose, onRefresh }: { branch: any; onClose: () => void; onRefresh: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setEditMode(false);
    setForm({
      branch_name: branch.branch_name ?? '',
      branch_code: branch.branch_code ?? '',
      phone:       branch.phone ?? '',
      email:       branch.email ?? '',
      address:     branch.address ?? '',
    });
  }, [branch.id]);

  const hi = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.branch_name.trim()) { toast.error('Branch name is required'); return; }
    if (!form.branch_code.trim()) { toast.error('Branch code is required'); return; }
    setSaving(true);
    try {
      await branchService.updateBranch(branch.id, cleanPayload(form));
      toast.success('Branch updated');
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to save')); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate "${branch.branch_name}"?`)) return;
    try {
      await branchService.deactivateBranch(branch.id);
      toast.success('Branch deactivated');
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed')); }
  };

  const isActive = branch.is_active !== false;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{branch.branch_name}</h3>
              <span className="font-mono text-xs text-gray-400">{branch.branch_code}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
            isActive ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
              {isActive ? 'Active Branch' : 'Inactive Branch'}
            </span>
          </div>

          {!editMode ? (
            <>
              <div>
                <SH title="Branch Information" />
                <DRow label="Branch Name" value={branch.branch_name} />
                <DRow label="Branch Code" value={branch.branch_code} />
                <DRow label="Phone"       value={branch.phone} />
                <DRow label="Email"       value={branch.email} />
              </div>
              {branch.address && (
                <div>
                  <SH title="Address" />
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{branch.address}</p>
                </div>
              )}
            </>
          ) : (
            <div>
              <SH title="Edit Branch" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input name="branch_name" value={form.branch_name} onChange={hi}
                    placeholder="e.g. Dubai Marina Branch"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Branch Code <span className="text-red-500">*</span>
                  </label>
                  <input name="branch_code" value={form.branch_code}
                    onChange={e => setForm(p => ({ ...p, branch_code: e.target.value.toUpperCase() }))}
                    placeholder="DXB-01"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input name="phone" value={form.phone} onChange={hi} placeholder="+971 4 xxx xxxx"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input name="email" value={form.email} onChange={hi} type="email" placeholder="branch@company.com"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <textarea name="address" value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    rows={3} placeholder="Full address..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center gap-3">
          {!editMode ? (
            <>
              <button onClick={handleDeactivate} disabled={!isActive}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <HiOutlineNoSymbol className="w-4 h-4" /> Deactivate
              </button>
              <button onClick={() => setEditMode(true)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all">
                <HiOutlinePencilSquare className="w-4 h-4" /> Edit Branch
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(false)}
                className="px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  : <><HiCheck className="w-4 h-4" />Save Changes</>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function BranchesPage() {
  const router = useRouter();
  const [branches, setBranches]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await branchService.listBranches();
      setBranches(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load branches'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = branches.filter(b =>
    !search.trim() ||
    b.branch_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.branch_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Branches</h1>
            <p className="text-sm text-gray-500">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/branches/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> Add Branch
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="relative max-w-sm">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineBuildingOffice2 className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-gray-500 font-medium">No branches found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Add your first branch to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b, i) => {
                const active = b.is_active !== false;
                return (
                  <tr key={b.id} onClick={() => setSelectedBranch(b)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {b.branch_name?.charAt(0)?.toUpperCase() ?? 'B'}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{b.branch_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{b.branch_code ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{b.phone ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate">{b.address ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>{active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selectedBranch && (
        <BranchDrawer
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}
