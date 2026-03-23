'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineFunnel,
  HiOutlineArrowUpTray,
  HiOutlineArrowPath,
  HiOutlineLink,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';

export default function TollFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unmatched'>('all');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [attributionFilter, setAttributionFilter] = useState('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [assignAgreementId, setAssignAgreementId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (activeTab === 'unmatched') params.unmatched = 'true';
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (attributionFilter !== 'ALL') params.attribution_status = attributionFilter;

      const res = await accountsService.getTollFines(params);
      setFines(res.data ?? res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load toll fines');
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, attributionFilter]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await accountsService.importTollFines(formData);
      toast.success('CSV imported successfully');
      fetchFines();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to import CSV');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReprocessMatching = async () => {
    try {
      await accountsService.reprocessTollFines();
      toast.success('Reprocessing started');
      fetchFines();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to reprocess matching');
    }
  };

  const handleAssign = async () => {
    if (!selectedFine || !assignAgreementId) return;
    try {
      setSubmitting(true);
      await accountsService.assignTollFine(selectedFine.id, assignAgreementId);
      toast.success('Fine assigned successfully');
      setShowAssignModal(false);
      setAssignAgreementId('');
      setSelectedFine(null);
      fetchFines();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to assign fine');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'plate_number',
      label: 'Plate',
      render: (_: any, row: any) => row.plate_number ?? 'N/A',
    },
    {
      key: 'type',
      label: 'Type',
      render: (_: any, row: any) => (
        <span className="capitalize text-sm">{(row.type ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'fine_date',
      label: 'Date',
      render: (_: any, row: any) =>
        row.fine_date ? new Date(row.fine_date).toLocaleDateString() : 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_: any, row: any) => `AED ${Number(row.amount ?? 0).toLocaleString()}`,
    },
    {
      key: 'location',
      label: 'Location',
      render: (_: any, row: any) => (
        <span className="text-sm truncate max-w-[150px] inline-block">
          {row.location ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'attribution_status',
      label: 'Attribution',
      render: (_: any, row: any) => <StatusBadge status={row.attribution_status ?? 'unknown'} />,
    },
    {
      key: 'agreement_number',
      label: 'Agreement',
      render: (_: any, row: any) => row.agreement_number ?? row.agreement_id ?? '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => {
        if (row.attribution_status === 'matched') return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFine(row);
              setShowAssignModal(true);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
            title="Assign to Agreement"
          >
            <HiOutlineLink className="h-4 w-4" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Toll & Fines" />
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <HiOutlineArrowUpTray className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleReprocessMatching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <HiOutlineArrowPath className="h-4 w-4" />
            Reprocess Matching
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unmatched')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'unmatched'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Unmatched
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="salik">Salik</option>
            <option value="traffic_fine">Traffic Fine</option>
            <option value="parking_fine">Parking Fine</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Attribution Status</label>
          <select
            value={attributionFilter}
            onChange={(e) => setAttributionFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable columns={columns} data={fines} emptyMessage="No toll fines found." />
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Fine to Agreement"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Assign this fine (AED {Number(selectedFine?.amount ?? 0).toLocaleString()}) for plate{' '}
            <strong>{selectedFine?.plate_number}</strong> to an agreement.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agreement ID</label>
            <input
              type="text"
              value={assignAgreementId}
              onChange={(e) => setAssignAgreementId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter agreement ID"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={submitting || !assignAgreementId}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign Fine'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
