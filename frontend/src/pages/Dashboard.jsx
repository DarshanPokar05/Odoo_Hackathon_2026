import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showOverdueDetails, setShowOverdueDetails] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30000,
  });

  const kpis = data?.data?.kpis || {};
  const recentActivity = data?.data?.recentActivity || [];

  const kpiCards = [
    { label: 'Available', value: kpis.assetsAvailable ?? 0, tag: 'AVAILABLE' },
    { label: 'Allocated', value: kpis.assetsAllocated ?? 0, tag: 'ALLOCATED' },
    { label: 'Reserved', value: kpis.assetsReserved ?? 0, tag: 'RESERVED' },
    { label: 'Active Bookings', value: kpis.activeBookings ?? 0, tag: null },
    { label: 'Pending Transfers', value: kpis.pendingTransfers ?? 0, tag: null },
    { label: 'Upcoming Returns', value: kpis.upcomingReturns ?? 0, tag: null },
  ];

  const overdueCount = kpis.overdueReturnsCount ?? 0;
  const overdueList = kpis.overdueAllocations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Today&apos;s Overview</h1>
          <p className="text-sm text-textSecondary mt-1">
            Real-time telemetry and aggregate metrics ({user?.role || 'User'} Console)
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/assets')}
            className="px-4 py-2 rounded-[6px] bg-accent text-bg font-mono text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            + Register Asset
          </button>
          <button
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 rounded-[6px] bg-surfaceAlt border border-border text-textPrimary font-mono text-xs font-semibold uppercase tracking-wider hover:border-accent transition-colors"
          >
            Book Resource
          </button>
          <button
            onClick={() => navigate('/maintenance')}
            className="px-4 py-2 rounded-[6px] bg-surfaceAlt border border-border text-textPrimary font-mono text-xs font-semibold uppercase tracking-wider hover:border-accent transition-colors"
          >
            Raise Request
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface border border-border rounded-[8px] p-8 text-center text-textSecondary font-mono">
          Loading live telemetry...
        </div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-[8px] p-6 text-red-400 font-mono text-sm">
          Failed to fetch dashboard summary metrics.
        </div>
      ) : (
        <>
          {/* KPI Card Grid (6 cards: Available / Allocated / Reserved / Active Bookings / Pending Transfers / Upcoming Returns) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-surface border border-border rounded-[8px] p-4 flex flex-col justify-between hover:border-accent transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-textSecondary font-mono uppercase tracking-wider">
                  <span>{card.label}</span>
                  {card.tag && <TagChip status={card.tag} label="" />}
                </div>
                <div className="mt-3 font-display font-bold text-2xl text-textPrimary">
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Overdue Returns Alert Banner (rendered strictly when count > 0) */}
          {overdueCount > 0 && (
            <div className="rounded-[8px] border border-amber-500/40 bg-amber-500/10 p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-mono font-bold text-sm text-amber-500">
                    {overdueCount} {overdueCount === 1 ? 'asset' : 'assets'} overdue for return — flagged for follow-up
                  </span>
                </div>
                <button
                  onClick={() => setShowOverdueDetails(!showOverdueDetails)}
                  className="text-xs font-mono font-semibold text-amber-500 hover:underline"
                >
                  {showOverdueDetails ? 'Hide Details' : 'View Overdue Items'}
                </button>
              </div>

              {showOverdueDetails && (
                <div className="mt-4 border-t border-amber-500/20 pt-4 space-y-2">
                  <div className="grid grid-cols-4 text-xs font-mono uppercase text-textSecondary pb-1 border-b border-border">
                    <div>Asset Tag</div>
                    <div>Asset Name</div>
                    <div>Holder</div>
                    <div>Due Date</div>
                  </div>
                  {overdueList.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-4 text-xs font-mono text-textPrimary py-1.5 border-b border-border/50"
                    >
                      <div className="font-semibold text-amber-500">{item.asset_tag}</div>
                      <div>{item.asset_name}</div>
                      <div>{item.holder_name || item.holder_email || 'Unassigned'}</div>
                      <div className="text-red-400">
                        {item.expected_return_date ? item.expected_return_date.substring(0, 10) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Activity Feed */}
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-textPrimary">Recent Activity</h2>
              <span className="text-xs font-mono text-textSecondary uppercase tracking-wider">
                System Audit Stream
              </span>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-sm text-textSecondary font-mono">
                  No recent activity recorded.
                </div>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="font-mono text-textPrimary">{log.action}</span>
                    </div>
                    <div className="text-xs font-mono text-textSecondary">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
