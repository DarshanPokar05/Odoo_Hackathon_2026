import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsApi } from '../api/auditsApi';
import { departmentsApi } from '../api/departmentsApi';
import { employeesApi } from '../api/employeesApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

export function Audits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdminOrManager = ['Admin', 'AssetManager'].includes(user?.role);

  // Fetch all audit cycles
  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => auditsApi.list(),
  });
  const allCycles = Array.isArray(cyclesData?.data?.items)
    ? cyclesData.data.items
    : Array.isArray(cyclesData?.data)
    ? cyclesData.data
    : [];

  const [selectedCycleId, setSelectedCycleId] = useState('');

  const activeCycleId = useMemo(() => {
    if (selectedCycleId) return selectedCycleId;
    if (allCycles.length > 0) return allCycles[0].id;
    return '';
  }, [selectedCycleId, allCycles]);

  // Fetch active cycle details
  const { data: cycleDetailData } = useQuery({
    queryKey: ['auditCycle', activeCycleId],
    queryFn: () => auditsApi.get(activeCycleId),
    enabled: Boolean(activeCycleId),
  });
  const activeCycle = cycleDetailData?.data?.cycle || null;

  // Check if current user is assigned auditor on this cycle
  const isAssignedAuditor = useMemo(() => {
    if (!activeCycle || !user) return false;
    if (user.role === 'Admin') return true;
    return (activeCycle.auditors || []).some((a) => a.id === user.id);
  }, [activeCycle, user]);

  // Discrepancy flagged items count
  const flaggedItemsCount = useMemo(() => {
    if (!activeCycle?.items) return 0;
    return activeCycle.items.filter((i) => ['Missing', 'Damaged'].includes(i.verification_status)).length;
  }, [activeCycle]);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: 'Q3 Physical Verification Audit',
    scopeDepartmentId: '',
    scopeLocation: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Departments query for scope
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });
  const departments = Array.isArray(deptsData?.data)
    ? deptsData.data
    : deptsData?.data?.items || [];

  // Employees query for auditor assignment
  const { data: empData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.list(),
  });
  const employees = Array.isArray(empData?.data)
    ? empData.data
    : empData?.data?.items || [];

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAuditorIds, setSelectedAuditorIds] = useState([]);

  // Close cycle confirmation modal state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => auditsApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      setShowCreateModal(false);
      if (res?.data?.cycle?.id) {
        setSelectedCycleId(res.data.cycle.id);
      }
    },
  });

  const startMutation = useMutation({
    mutationFn: (id) => auditsApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditCycle', activeCycleId] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, auditorIds }) => auditsApi.assignAuditors(id, auditorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditCycle', activeCycleId] });
      setShowAssignModal(false);
    },
  });

  const verifyItemMutation = useMutation({
    mutationFn: ({ cycleId, itemId, status }) =>
      auditsApi.updateItem(cycleId, itemId, { verificationStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auditCycle', activeCycleId] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => auditsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['auditCycle', activeCycleId] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowCloseConfirm(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">
            Asset Audit & Reconciliation
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Physical inventory cycles with discrepancy tracking and automated Lost transitions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cycle selector */}
          <select
            value={activeCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="bg-surface border border-border rounded-[8px] px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
          >
            {allCycles.length === 0 && <option value="">No Audit Cycles</option>}
            {allCycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>

          {isAdminOrManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-[8px] bg-accent text-bg text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90"
            >
              + New Audit Cycle
            </button>
          )}
        </div>
      </div>

      {/* HEADER CARD SUMMARIZING ACTIVE CYCLE */}
      {activeCycle ? (
        <div className="bg-surface border border-border rounded-[8px] p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-textPrimary">
                  {activeCycle.name}
                </h2>
                <TagChip status={activeCycle.status?.toUpperCase() || 'PLANNED'} />
              </div>
              <p className="text-xs font-mono text-textSecondary mt-1">
                Scope: {activeCycle.scope_department_name || activeCycle.scope_location || 'Organization-Wide'} · Range:{' '}
                {activeCycle.start_date} to {activeCycle.end_date}
              </p>
              <div className="text-xs font-mono text-textSecondary mt-1">
                Auditors:{' '}
                {activeCycle.auditors?.length > 0
                  ? activeCycle.auditors.map((a) => a.name).join(', ')
                  : 'None Assigned'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdminOrManager && (
                <button
                  onClick={() => {
                    setSelectedAuditorIds(activeCycle.auditors?.map((a) => a.id) || []);
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
                >
                  Assign Auditors
                </button>
              )}

              {isAdminOrManager && activeCycle.status === 'Planned' && (
                <button
                  onClick={() => startMutation.mutate(activeCycle.id)}
                  className="px-4 py-1.5 rounded-[6px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold hover:bg-emerald-500/30"
                >
                  Start Cycle
                </button>
              )}

              {isAdminOrManager && activeCycle.status === 'In Progress' && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="px-4 py-1.5 rounded-[6px] bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-semibold hover:bg-red-500/30"
                >
                  Close Audit Cycle
                </button>
              )}
            </div>
          </div>

          {/* DISCREPANCY BANNER ONCE ANY ITEMS ARE FLAGGED */}
          {flaggedItemsCount > 0 && (
            <div className="p-3.5 rounded-[6px] bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between">
              <span className="font-bold">
                ⚠ {flaggedItemsCount} assets flagged — discrepancy report generated automatically
              </span>
              <span className="text-[11px] opacity-80">
                Unresolved Missing assets will be marked 'Lost' upon closure
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-[8px] p-12 text-center text-textSecondary font-mono text-xs">
          No audit cycle selected. Create an audit cycle to begin reconciliation.
        </div>
      )}

      {/* VERIFICATION TABLE */}
      {activeCycle && (
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Audit Scope Assets List ({activeCycle.items?.length || 0})
            </h3>
            {!isAssignedAuditor && activeCycle.status === 'In Progress' && (
              <span className="text-[11px] font-mono text-amber-400">
                Locked: Only assigned auditors can verify items
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surfaceAlt text-[11px] font-mono uppercase text-textSecondary">
                  <th className="py-3 px-6">Asset Tag / Name</th>
                  <th className="py-3 px-6">Expected Location</th>
                  <th className="py-3 px-6">Current Status</th>
                  <th className="py-3 px-6">Verification</th>
                  <th className="py-3 px-6">Verified By</th>
                  <th className="py-3 px-6 text-right">Auditor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {!activeCycle.items || activeCycle.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-textSecondary">
                      No assets populated. Click "Start Cycle" to auto-populate assets matching
                      scope.
                    </td>
                  </tr>
                ) : (
                  activeCycle.items.map((item) => (
                    <tr key={item.id} className="hover:bg-surfaceAlt/50">
                      <td className="py-3 px-6">
                        <div className="font-bold text-textPrimary">{item.asset_tag}</div>
                        <div className="text-[11px] text-textSecondary">{item.asset_name}</div>
                      </td>
                      <td className="py-3 px-6 text-textSecondary">
                        {item.expected_location || 'HQ Storage'}
                      </td>
                      <td className="py-3 px-6">
                        <TagChip status={item.asset_status?.toUpperCase() || 'AVAILABLE'} />
                      </td>
                      <td className="py-3 px-6">
                        <TagChip
                          status={item.verification_status?.toUpperCase() || 'PENDING'}
                          label={item.verification_status?.toUpperCase()}
                        />
                      </td>
                      <td className="py-3 px-6 text-textSecondary">
                        {item.verified_by_name || '—'}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {activeCycle.status === 'In Progress' && isAssignedAuditor && !item.locked && (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() =>
                                verifyItemMutation.mutate({
                                  cycleId: activeCycle.id,
                                  itemId: item.id,
                                  status: 'Verified',
                                })
                              }
                              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px]"
                            >
                              ✔ Verified
                            </button>
                            <button
                              onClick={() =>
                                verifyItemMutation.mutate({
                                  cycleId: activeCycle.id,
                                  itemId: item.id,
                                  status: 'Missing',
                                })
                              }
                              className="px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 text-[10px]"
                            >
                              ✘ Missing
                            </button>
                            <button
                              onClick={() =>
                                verifyItemMutation.mutate({
                                  cycleId: activeCycle.id,
                                  itemId: item.id,
                                  status: 'Damaged',
                                })
                              }
                              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px]"
                            >
                              ⚠ Damaged
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE AUDIT CYCLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">Create Audit Cycle</h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Cycle Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Scope Department (Optional)</label>
                <select
                  value={createForm.scopeDepartmentId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, scopeDepartmentId: e.target.value }))
                  }
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="">— Organization-Wide —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-textSecondary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-textSecondary mb-1">End Date</label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createMutation.mutate({
                    name: createForm.name,
                    scopeDepartmentId: createForm.scopeDepartmentId || null,
                    startDate: createForm.startDate,
                    endDate: createForm.endDate,
                  })
                }
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN AUDITORS MODAL */}
      {showAssignModal && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Assign Cycle Auditors
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-xs">
              {employees.map((emp) => {
                const checked = selectedAuditorIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 p-2 rounded bg-surfaceAlt border border-border cursor-pointer hover:border-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setSelectedAuditorIds((prev) => prev.filter((id) => id !== emp.id));
                        } else {
                          setSelectedAuditorIds((prev) => [...prev, emp.id]);
                        }
                      }}
                      className="accent-accent"
                    />
                    <div>
                      <div className="font-bold text-textPrimary">{emp.name}</div>
                      <div className="text-[11px] text-textSecondary">{emp.email} ({emp.role})</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  assignMutation.mutate({
                    id: activeCycle.id,
                    auditorIds: selectedAuditorIds,
                  })
                }
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                Save Auditors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IRREVERSIBLE ACTION CONFIRMATION MODAL (Global Constraint 6) */}
      {showCloseConfirm && activeCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface border border-red-500/40 rounded-[8px] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
                ⚠
              </span>
              <h3 className="font-display font-bold text-lg text-textPrimary">
                Confirm Audit Closure
              </h3>
            </div>

            <div className="text-xs font-mono text-textSecondary space-y-2">
              <p>
                Closing an audit cycle is <strong className="text-red-400">IRREVERSIBLE</strong>.
              </p>
              <p>
                • All items on cycle <strong className="text-textPrimary">{activeCycle.name}</strong>{' '}
                will be permanently locked.
              </p>
              <p>
                • Any asset marked <strong className="text-red-400">'Missing'</strong> will
                automatically transition its lifecycle state to{' '}
                <strong className="text-red-400">'Lost'</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() => closeMutation.mutate(activeCycle.id)}
                className="px-4 py-2 rounded-[6px] bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold uppercase tracking-wider"
              >
                Permanently Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Audits;
