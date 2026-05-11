'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';
import { branchService } from '@/services/branch.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const emptyForm = {
  name: '',
  city: '',
  address: '',
  phone_number: '',
  email: '',
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await branchService.listBranches();
      setBranches(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load branches'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const openEdit = (branch: any) => {
    setSelectedBranch(branch);
    setForm({
      name: branch.name ?? '',
      city: branch.city ?? '',
      address: branch.address ?? '',
      phone_number: branch.phone_number ?? '',
      email: branch.email ?? '',
    });
    setShowEditModal(true);
  };

  const openDeactivate = (branch: any) => {
    setSelectedBranch(branch);
    setShowDeactivateModal(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Branch name is required'); return; }
    try {
      setSubmitting(true);
      await branchService.createBranch(cleanPayload(form));
      toast.success('Branch created');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchBranches();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create branch'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name.trim()) { toast.error('Branch name is required'); return; }
    try {
      setSubmitting(true);
      await branchService.updateBranch(selectedBranch.id, cleanPayload(form));
      toast.success('Branch updated');
      setShowEditModal(false);
      fetchBranches();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to update branch'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSubmitting(true);
      await branchService.deactivateBranch(selectedBranch.id);
      toast.success('Branch deactivated');
      setShowDeactivateModal(false);
      fetchBranches();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to deactivate branch'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      render: (row: any) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      header: 'City',
      render: (row: any) => row.city ?? '—',
    },
    {
      header: 'Address',
      render: (row: any) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block">{row.address ?? '—'}</span>
      ),
    },
    {
      header: 'Phone',
      render: (row: any) => row.phone_number ?? '—',
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.is_active === false ? 'INACTIVE' : 'ACTIVE'} />,
    },
    {
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDeactivate(row); }}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Deactivate"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const BranchForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Branch Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. Dubai Marina Branch"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dubai"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
          <input
            type="text"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+971 4 xxx xxxx"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Full address"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="branch@company.com"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="h-5 w-5 text-blue-600" />
          </div>
          <PageHeader title="Branches" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Add Branch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={branches}
          emptyMessage="No branches found. Add your first branch."
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Branch">
        <div className="space-y-4">
          <BranchForm />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Branch">
        <div className="space-y-4">
          <BranchForm />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirm Modal */}
      <Modal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Branch">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to deactivate <strong>{selectedBranch?.name}</strong>? This branch will no longer appear in selections.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowDeactivateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
