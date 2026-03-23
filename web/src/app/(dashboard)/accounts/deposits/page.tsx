'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineFunnel,
  HiOutlineBanknotes,
  HiOutlineShieldCheck,
  HiOutlineArrowUturnLeft,
  HiOutlineNoSymbol,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';

type DepositStatus = 'ALL' | 'HELD' | 'USED' | 'RELEASED' | 'FORFEITED' | 'REFUNDED';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DepositStatus>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'eligible'>('all');

  // Use modal
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [useAmount, setUseAmount] = useState('');

  // Forfeit modal
  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const [forfeitJustification, setForfeitJustification] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (activeTab === 'eligible') params.eligible_for_release = 'true';

      const res = await accountsService.getDeposits(params);
      setDeposits(res.data ?? res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, activeTab]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleUse = async () => {
    if (!selectedDeposit || !useAmount) return;
    try {
      setSubmitting(true);
      await accountsService.useDeposit(selectedDeposit.id, Number(useAmount));
      toast.success('Deposit used successfully');
      setShowUseModal(false);
      setUseAmount('');
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to use deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (deposit: any) => {
    try {
      await accountsService.releaseDeposit(deposit.id);
      toast.success('Deposit released');
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to release deposit');
    }
  };

  const handleForfeit = async () => {
    if (!selectedDeposit) return;
    try {
      setSubmitting(true);
      await accountsService.forfeitDeposit(selectedDeposit.id, forfeitJustification);
      toast.success('Deposit forfeited');
      setShowForfeitModal(false);
      setForfeitJustification('');
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to forfeit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async (deposit: any) => {
    try {
      await accountsService.refundDeposit(deposit.id);
      toast.success('Deposit refunded');
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to refund deposit');
    }
  };

  const columns = [
    {
      key: 'agreement_number',
      label: 'Agreement #',
      render: (_: any, row: any) => row.agreement_number ?? row.agreement_id ?? 'N/A',
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (_: any, row: any) => row.customer?.name ?? row.customer_name ?? 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_: any, row: any) => `AED ${Number(row.amount ?? 0).toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'collected_at',
      label: 'Collected At',
      render: (_: any, row: any) =>
        row.collected_at ? new Date(row.collected_at).toLocaleDateString() : 'N/A',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => {
        if (row.status !== 'HELD') return null;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDeposit(row);
                setShowUseModal(true);
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
              title="Use"
            >
              <HiOutlineBanknotes className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRelease(row);
              }}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
              title="Release"
            >
              <HiOutlineShieldCheck className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDeposit(row);
                setShowForfeitModal(true);
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
              title="Forfeit"
            >
              <HiOutlineNoSymbol className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefund(row);
              }}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
              title="Refund"
            >
              <HiOutlineArrowUturnLeft className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposits" />

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
          All Deposits
        </button>
        <button
          onClick={() => setActiveTab('eligible')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'eligible'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Eligible for Release
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DepositStatus)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="HELD">Held</option>
            <option value="USED">Used</option>
            <option value="RELEASED">Released</option>
            <option value="FORFEITED">Forfeited</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable columns={columns} data={deposits} emptyMessage="No deposits found." />
      )}

      {/* Use Modal */}
      <Modal isOpen={showUseModal} onClose={() => setShowUseModal(false)} title="Use Deposit">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Deposit amount: AED {Number(selectedDeposit?.amount ?? 0).toLocaleString()}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Use</label>
            <input
              type="number"
              value={useAmount}
              onChange={(e) => setUseAmount(e.target.value)}
              max={selectedDeposit?.amount}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowUseModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUse}
              disabled={submitting || !useAmount}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Use Deposit'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Forfeit Modal */}
      <Modal
        isOpen={showForfeitModal}
        onClose={() => setShowForfeitModal(false)}
        title="Forfeit Deposit"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This action will forfeit the deposit of AED{' '}
            {Number(selectedDeposit?.amount ?? 0).toLocaleString()}.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
            <textarea
              value={forfeitJustification}
              onChange={(e) => setForfeitJustification(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide a justification for forfeiting this deposit..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowForfeitModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleForfeit}
              disabled={submitting || !forfeitJustification}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Forfeit Deposit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
