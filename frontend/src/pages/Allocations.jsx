import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationsApi } from '../api/allocationsApi';
import { assetsApi } from '../api/assetsApi';
import { employeesApi } from '../api/employeesApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

export function Allocations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  // 409 Conflict state / transfer mode
  const [conflictHolder, setConflictHolder] = useState(null);
  const [transferReason, setTransferReason] = useState('');

  // Return modal state
  const [returningAlloc, setReturningAlloc] = useState(null);
  const [returnNotes, setReturnNotes] = useState('Good condition on return');

  // Queries
  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list({ limit: 100 }),
  });
  const assets = Array.isArray(assetsData?.data)
    ? assetsData.data
    : assetsData?.data?.items || [];

  const { data: empsData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  });
  const employees = Array.isArray(empsData?.data?.data)
    ? empsData.data.data
    : Array.isArray(empsData?.data)
    ? empsData.data
    : [];

  const { data: allocsData, isLoading: allocsLoading } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => allocationsApi.list({ limit: 50 }),
  });
  const allocations = Array.isArray(allocsData?.data)
    ? allocsData.data
    : allocsData?.data?.items || [];

  const { data: transfersData } = useQuery({
    queryKey: ['transferRequests'],
    queryFn: () => allocationsApi.listTransfers({ status: 'Requested' }),
  });
  const pendingTransfers = Array.isArray(transfersData?.data?.transfers)
    ? transfersData.data.transfers
    : Array.isArray(transfersData?.data)
    ? transfersData.data
    : [];

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  // Allocate mutation
  const allocateMutation = useMutation({
    mutationFn: (payload) => allocationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSelectedAssetId('');
      setTargetEmployeeId('');
      setExpectedReturnDate('');
      setConflictHolder(null);
    },
    onError: (err) => {
      const response = err.response?.data;
      if (
        response?.error?.code === 'ASSET_ALREADY_ALLOCATED' ||
        response?.error?.offerTransfer
      ) {
        setConflictHolder(
          response.error.currentHolder || {
            name: 'Another User',
            departmentName: 'Assigned Dept',
          }
        );
      }
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: (payload) => allocationsApi.createTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
      setConflictHolder(null);
      setSelectedAssetId('');
      setTargetEmployeeId('');
      setTransferReason('');
    },
  });

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: ({ id, notes }) => allocationsApi.returnAsset(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setReturningAlloc(null);
    },
  });

  // Transfer Approve/Reject
  const approveTransferMutation = useMutation({
    mutationFn: (id) => allocationsApi.approveTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const rejectTransferMutation = useMutation({
    mutationFn: (id) => allocationsApi.rejectTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferRequests'] });
    },
  });

  const handleAssetSelect = (e) => {
    const id = e.target.value;
    setSelectedAssetId(id);
    const asset = assets.find((a) => a.id === id);
    if (asset && asset.status === 'Allocated') {
      // Pre-flag conflict holder
      setConflictHolder({
        name: asset.current_holder_name || asset.current_holder_email || 'Current Holder',
        departmentName: asset.department_name || 'Assigned Dept',
      });
    } else {
      setConflictHolder(null);
    }
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!selectedAssetId || !targetEmployeeId) return;
    allocateMutation.mutate({
      assetId: selectedAssetId,
      employeeId: targetEmployeeId,
      expectedReturnDate: expectedReturnDate || null,
    });
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedAssetId || !targetEmployeeId) return;
    transferMutation.mutate({
      assetId: selectedAssetId,
      requestedToUserId: targetEmployeeId,
      reason: transferReason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-textPrimary">
          Asset Allocation &amp; Transfer
        </h1>
        <p className="text-sm text-textSecondary mt-1">
          Assign inventory items, manage transfer requests, and inspect historical check-ins
        </p>
      </div>

      {/* ALLOCATION / TRANSFER FORM CARD */}
      <div className="bg-surface border border-border rounded-[8px] p-6 space-y-5">
        <h2 className="font-display font-bold text-lg text-textPrimary">
          Assign or Transfer Asset
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="block text-textSecondary mb-1">Select Asset *</label>
            <select
              value={selectedAssetId}
              onChange={handleAssetSelect}
              className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            >
              <option value="">Search asset tag or name...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_tag} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-textSecondary mb-1">Assignee / Target User *</label>
            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-textSecondary mb-1">Expected Return Date</label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* EXACT UX FOR CONFLICT HOLDER (GLOBAL CONSTRAINT 3 & APPENDIX C) */}
        {conflictHolder ? (
          <div className="rounded-[8px] border border-red-500/50 bg-red-500/10 p-5 space-y-4">
            <div className="flex items-center gap-2 font-mono font-bold text-sm text-red-400">
              <span>⚠️</span>
              <span>
                Already allocated to {conflictHolder.name} ({conflictHolder.departmentName || 'Assigned Department'}) — direct re-allocation is blocked, submit a transfer request below
              </span>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 pt-2 border-t border-red-500/20 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-textSecondary mb-1">From (Current Holder)</label>
                  <input
                    type="text"
                    readOnly
                    value={`${conflictHolder.name} (${conflictHolder.departmentName || 'Department'})`}
                    className="w-full bg-surface border border-border rounded-[6px] px-3 py-2 text-textSecondary"
                  />
                </div>

                <div>
                  <label className="block text-textSecondary mb-1">Transfer Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Needed for Client Demo in Room 402..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full bg-surface border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="px-5 py-2 rounded-[6px] bg-accent text-bg font-semibold uppercase hover:opacity-90"
                >
                  {transferMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={handleAllocateSubmit}
              disabled={!selectedAssetId || !targetEmployeeId || allocateMutation.isPending}
              className="px-5 py-2 rounded-[6px] bg-accent text-bg font-mono text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
            >
              {allocateMutation.isPending ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        )}
      </div>

      {/* PENDING TRANSFER REQUESTS SECTION (Approve / Reject) */}
      {pendingTransfers.length > 0 && (
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-textPrimary">
              Pending Transfer Requests ({pendingTransfers.length})
            </h2>
            <span className="text-xs font-mono text-accent uppercase tracking-wider">
              Action Required
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">Requested To</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm font-mono">
              {pendingTransfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-surfaceAlt/50">
                  <td className="py-3 px-4 font-bold text-accent">{tr.asset_tag} — {tr.asset_name}</td>
                  <td className="py-3 px-4">{tr.requested_by_name}</td>
                  <td className="py-3 px-4 font-semibold text-textPrimary">{tr.requested_to_name}</td>
                  <td className="py-3 px-4 text-textSecondary">{tr.reason}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {['Admin', 'AssetManager', 'DepartmentHead'].includes(user?.role) && (
                      <>
                        <button
                          onClick={() => approveTransferMutation.mutate(tr.id)}
                          className="px-3 py-1 rounded bg-accent text-bg text-xs font-semibold uppercase hover:opacity-90"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectTransferMutation.mutate(tr.id)}
                          className="px-3 py-1 rounded border border-border text-xs text-textSecondary hover:text-textPrimary"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALLOCATION HISTORY TABLE */}
      <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-textPrimary">
            Allocation History
          </h2>
          <span className="text-xs font-mono text-textSecondary uppercase tracking-wider">
            Reverse-Chronological Stream
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-mono">
            {allocsLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-textSecondary">
                  Loading allocations...
                </td>
              </tr>
            ) : allocations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-textSecondary">
                  No allocations recorded yet.
                </td>
              </tr>
            ) : (
              allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-surfaceAlt/50">
                  <td className="py-3 px-4 text-textSecondary">
                    {alloc.allocated_date ? alloc.allocated_date.substring(0, 10) : ''}
                  </td>
                  <td className="py-3 px-4 font-bold text-accent">{alloc.asset_tag} — {alloc.asset_name}</td>
                  <td className="py-3 px-4 font-semibold text-textPrimary">{alloc.employee_name}</td>
                  <td className="py-3 px-4 text-textSecondary">{alloc.department_name || '—'}</td>
                  <td className="py-3 px-4">
                    <TagChip
                      status={alloc.status === 'Active' ? 'ALLOCATED' : 'AVAILABLE'}
                      label={alloc.status}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {alloc.status === 'Active' && ['Admin', 'AssetManager'].includes(user?.role) && (
                      <button
                        onClick={() => {
                          setReturningAlloc(alloc);
                          setReturnNotes('Good condition on return');
                        }}
                        className="text-xs text-accent font-semibold hover:underline"
                      >
                        Check-in / Return
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* RETURN CHECK-IN MODAL */}
      {returningAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Asset Return &amp; Condition Check-in
            </h3>
            <p className="text-xs font-mono text-textSecondary">
              Checking in <span className="text-accent font-bold">{returningAlloc.asset_tag}</span> from{' '}
              <span className="text-textPrimary font-semibold">{returningAlloc.employee_name}</span>
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Condition &amp; Check-in Notes *</label>
                <textarea
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] p-3 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReturningAlloc(null)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  returnMutation.mutate({ id: returningAlloc.id, notes: returnNotes })
                }
                disabled={returnMutation.isPending}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Allocations;
