import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import { assetsApi } from '../api/assetsApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

const COLUMNS = [
  { id: 'Pending', title: 'Pending Approval', border: 'border-amber-500/40', headerBg: 'bg-amber-500/10' },
  { id: 'Approved', title: 'Approved', border: 'border-blue-500/40', headerBg: 'bg-blue-500/10' },
  { id: 'Technician Assigned', title: 'Technician Assigned', border: 'border-purple-500/40', headerBg: 'bg-purple-500/10' },
  { id: 'In Progress', title: 'In Progress', border: 'border-cyan-500/40', headerBg: 'bg-cyan-500/10' },
  { id: 'Resolved', title: 'Resolved', border: 'border-emerald-500/40', headerBg: 'bg-emerald-500/10' },
];

export function Maintenance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdminOrManager = ['Admin', 'AssetManager'].includes(user?.role);

  // Fetch Maintenance Requests
  const { data: maintData, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceApi.list(),
  });
  const requests = Array.isArray(maintData?.data?.items)
    ? maintData.data.items
    : Array.isArray(maintData?.data)
    ? maintData.data
    : [];

  // Fetch Assets for Raise Request modal
  const { data: assetsData } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list(),
  });
  const allAssets = Array.isArray(assetsData?.data)
    ? assetsData.data
    : assetsData?.data?.items || [];

  // Raise Request Modal State
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [raiseForm, setRaiseForm] = useState({
    assetId: '',
    issueDescription: '',
    priority: 'Medium',
  });

  // Assign Tech Modal State
  const [showTechModal, setShowTechModal] = useState(false);
  const [techTargetId, setTechTargetId] = useState(null);
  const [technicianName, setTechnicianName] = useState('');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => maintenanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setShowRaiseModal(false);
      setRaiseForm({ assetId: '', issueDescription: '', priority: 'Medium' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => maintenanceApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => maintenanceApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, techName }) => maintenanceApi.assignTechnician(id, techName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setShowTechModal(false);
      setTechnicianName('');
      setTechTargetId(null);
    },
  });

  const startMutation = useMutation({
    mutationFn: (id) => maintenanceApi.start(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => maintenanceApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">
            Maintenance Management
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Five-column interactive workflow Kanban board linking repair tickets to asset states
          </p>
        </div>

        <button
          onClick={() => setShowRaiseModal(true)}
          className="px-4 py-2 rounded-[8px] bg-accent text-bg text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90"
        >
          + Raise Request
        </button>
      </div>

      {/* 5-COLUMN KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colCards = requests.filter((r) => r.status === col.id);
          return (
            <div
              key={col.id}
              className={`bg-surface border ${col.border} rounded-[8px] flex flex-col min-h-[480px] overflow-hidden`}
            >
              {/* Column Header */}
              <div
                className={`${col.headerBg} px-4 py-3 border-b border-border flex items-center justify-between`}
              >
                <span className="font-display font-bold text-xs text-textPrimary uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="font-mono text-xs font-bold text-textSecondary px-2 py-0.5 rounded bg-surface border border-border">
                  {colCards.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {colCards.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-xs font-mono text-textSecondary/60">
                    No requests
                  </div>
                ) : (
                  colCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-surfaceAlt border border-border rounded-[6px] p-3 space-y-2.5 transition-all hover:border-accent/40 shadow-sm"
                    >
                      {/* Top row: Asset Tag & Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-accent">
                          {card.asset_tag}
                        </span>
                        <TagChip
                          status={card.priority?.toUpperCase()}
                          label={card.priority?.toUpperCase()}
                        />
                      </div>

                      {/* Asset Name */}
                      <div className="font-display font-semibold text-xs text-textPrimary">
                        {card.asset_name || card.asset_tag}
                      </div>

                      {/* Issue Summary */}
                      <p className="text-xs text-textSecondary line-clamp-3">
                        {card.issue_description}
                      </p>

                      {/* Technician info once assigned */}
                      {card.technician_name && (
                        <div className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded-[4px] border border-purple-500/30">
                          Tech: {card.technician_name}
                        </div>
                      )}

                      {/* Raised By */}
                      <div className="text-[10px] font-mono text-textSecondary">
                        Raised by {card.raised_by_name || 'Employee'}
                      </div>

                      {/* ACTION BUTTONS BASED ON COLUMN & ROLE */}
                      <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
                        {card.status === 'Pending' && isAdminOrManager && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(card.id)}
                              className="flex-1 py-1 px-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono hover:bg-emerald-500/30"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(card.id)}
                              className="py-1 px-2 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-mono hover:bg-red-500/30"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {card.status === 'Approved' && isAdminOrManager && (
                          <button
                            onClick={() => {
                              setTechTargetId(card.id);
                              setShowTechModal(true);
                            }}
                            className="w-full py-1.5 px-2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono hover:bg-purple-500/30"
                          >
                            + Assign Technician
                          </button>
                        )}

                        {card.status === 'Technician Assigned' && (
                          <button
                            onClick={() => startMutation.mutate(card.id)}
                            className="w-full py-1.5 px-2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono hover:bg-cyan-500/30"
                          >
                            Start Work
                          </button>
                        )}

                        {card.status === 'In Progress' && (
                          <button
                            onClick={() => resolveMutation.mutate(card.id)}
                            className="w-full py-1.5 px-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono hover:bg-emerald-500/30"
                          >
                            Mark Resolved
                          </button>
                        )}

                        {card.status === 'Resolved' && (
                          <span className="w-full text-center text-[10px] font-mono text-emerald-400">
                            ✔ Returned to Available
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTNOTE TEXT (Global Constraint 5 Direct Restatement) */}
      <div className="bg-surfaceAlt/60 border border-border rounded-[8px] p-4 text-xs font-mono text-textSecondary flex items-center gap-2">
        <span className="text-accent font-bold">ℹ NOTE:</span>
        <span>
          Approving a card moves the asset to Under Maintenance, resolving returns it to Available.
        </span>
      </div>

      {/* RAISE REQUEST MODAL */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Raise Maintenance Request
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Select Asset *</label>
                <select
                  value={raiseForm.assetId}
                  onChange={(e) => setRaiseForm((prev) => ({ ...prev, assetId: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="">— Select an asset —</option>
                  {allAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.asset_tag} — {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe hardware problem or required servicing..."
                  value={raiseForm.issueDescription}
                  onChange={(e) =>
                    setRaiseForm((prev) => ({ ...prev, issueDescription: e.target.value }))
                  }
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Priority</label>
                <select
                  value={raiseForm.priority}
                  onChange={(e) => setRaiseForm((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRaiseModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                disabled={!raiseForm.assetId || !raiseForm.issueDescription}
                onClick={() => createMutation.mutate(raiseForm)}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90 disabled:opacity-40"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TECHNICIAN MODAL */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Assign Technician
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Technician Name / ID *</label>
                <input
                  type="text"
                  placeholder="e.g. R Verma (Certified Tech)"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTechModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                disabled={!technicianName}
                onClick={() => assignMutation.mutate({ id: techTargetId, techName: technicianName })}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90 disabled:opacity-40"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
