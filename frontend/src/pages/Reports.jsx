import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reportsApi';
import { TagChip } from '../components/TagChip';

export function Reports() {
  const [reportType, setReportType] = useState('utilization');

  // Fetch reports aggregate data
  const { data: utilData, isLoading: utilLoading } = useQuery({
    queryKey: ['reportsUtilization'],
    queryFn: () => reportsApi.getUtilization(),
  });
  const mostUsed = utilData?.data?.mostUsed || [];
  const idleAssets = utilData?.data?.idle || [];

  const { data: maintData } = useQuery({
    queryKey: ['reportsMaintenance'],
    queryFn: () => reportsApi.getMaintenanceFrequency(),
  });
  const maintByCategory = maintData?.data?.byCategory || [];
  const maintByAsset = maintData?.data?.byAsset || [];

  const { data: dueData } = useQuery({
    queryKey: ['reportsDue'],
    queryFn: () => reportsApi.getDueForMaintenanceOrRetirement(),
  });
  const dueList = dueData?.data?.items || [];

  const { data: deptSummaryData } = useQuery({
    queryKey: ['reportsDeptSummary'],
    queryFn: () => reportsApi.getDepartmentAllocationSummary(),
  });
  const deptSummary = deptSummaryData?.data?.items || [];

  // Find max values for visual bar scaling
  const maxDeptAlloc = Math.max(1, ...deptSummary.map((d) => Number(d.active_allocations || 0)));
  const maxMaintCount = Math.max(1, ...maintByCategory.map((c) => Number(c.maintenance_count || 0)));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">
            Reports & Analytics
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Real-time asset utilization metrics, idle alerts, and maintenance frequency analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="bg-surface border border-border rounded-[8px] px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
          >
            <option value="utilization">Utilization Report</option>
            <option value="maintenance">Maintenance Frequency</option>
            <option value="due">Due for Service / Retirement</option>
            <option value="department">Department Allocation Summary</option>
          </select>

          {/* EXPORT REPORT BUTTON (Visual primary terminal action using accent color) */}
          <button
            onClick={() => reportsApi.downloadExport(reportType)}
            className="px-5 py-2.5 rounded-[8px] bg-accent text-bg text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 shadow-md transition-all flex items-center gap-2"
          >
            <span>↓</span> Export Report (.CSV)
          </button>
        </div>
      </div>

      {/* TWO SIDE-BY-SIDE CHART CARDS AT TOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart Card 1: Utilization by Department (Bar Visualizer) */}
        <div className="bg-surface border border-border rounded-[8px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Utilization by Department (Active Allocations)
            </h3>
            <span className="text-xs font-mono text-accent">BAR DISTRIBUTION</span>
          </div>

          <div className="space-y-3 pt-2">
            {deptSummary.length === 0 ? (
              <p className="text-xs font-mono text-textSecondary">No department data available.</p>
            ) : (
              deptSummary.map((dept) => {
                const count = Number(dept.active_allocations || 0);
                const percent = Math.max(8, (count / maxDeptAlloc) * 100);
                return (
                  <div key={dept.id || dept.department_name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-textPrimary">{dept.department_name}</span>
                      <span className="text-textSecondary">{count} assets allocated</span>
                    </div>
                    <div className="w-full bg-surfaceAlt rounded-full h-2.5 overflow-hidden border border-border/40">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-accent h-full transition-all duration-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart Card 2: Maintenance Frequency by Category (Trend Visualizer) */}
        <div className="bg-surface border border-border rounded-[8px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Maintenance Frequency by Category
            </h3>
            <span className="text-xs font-mono text-cyan-400">CATEGORY FEED</span>
          </div>

          <div className="space-y-3 pt-2">
            {maintByCategory.length === 0 ? (
              <p className="text-xs font-mono text-textSecondary">No maintenance log data.</p>
            ) : (
              maintByCategory.map((cat) => {
                const count = Number(cat.maintenance_count || 0);
                const percent = Math.max(8, (count / maxMaintCount) * 100);
                return (
                  <div key={cat.category_name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-textPrimary">{cat.category_name}</span>
                      <span className="text-textSecondary">{count} service records</span>
                    </div>
                    <div className="w-full bg-surfaceAlt rounded-full h-2.5 overflow-hidden border border-border/40">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-cyan-400 h-full transition-all duration-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TWO SIDE-BY-SIDE LISTS: MOST USED vs IDLE ASSETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Used Assets */}
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Most Used Assets (High Engagement)
            </h3>
            <TagChip status="ACTIVE" label="TOP 10" />
          </div>
          <div className="p-4 divide-y divide-border/60 flex-1 overflow-y-auto">
            {mostUsed.length === 0 ? (
              <p className="py-4 text-xs font-mono text-textSecondary text-center">No asset usage found.</p>
            ) : (
              mostUsed.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-accent">{item.asset_tag}</span>
                    <p className="text-xs text-textPrimary">{item.name}</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    {item.usage_count} bookings/allocations
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Idle Assets */}
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Idle Assets (Unused 60+ Days)
            </h3>
            <span className="text-xs font-mono text-amber-400">OPTIMIZATION ALERT</span>
          </div>
          <div className="p-4 divide-y divide-border/60 flex-1 overflow-y-auto">
            {idleAssets.length === 0 ? (
              <p className="py-4 text-xs font-mono text-textSecondary text-center">
                All available assets have been utilized within the last 60 days.
              </p>
            ) : (
              idleAssets.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">{item.asset_tag}</span>
                    <p className="text-xs text-textPrimary">{item.name}</p>
                  </div>
                  <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                    Idle / Available
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SINGLE LIST: ASSETS DUE FOR MAINTENANCE OR RETIREMENT */}
      <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-textPrimary">
            Assets Due for Maintenance or Nearing Retirement ({dueList.length})
          </h3>
          <span className="text-xs font-mono text-red-400">LIFECYCLE RISK</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surfaceAlt text-[11px] font-mono uppercase text-textSecondary">
                <th className="py-3 px-6">Asset Tag</th>
                <th className="py-3 px-6">Asset Name</th>
                <th className="py-3 px-6">Acquisition Date</th>
                <th className="py-3 px-6">Lifecycle Flag / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs font-mono">
              {dueList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-textSecondary">
                    No assets currently flagged for maintenance thresholds or retirement age.
                  </td>
                </tr>
              ) : (
                dueList.map((item) => (
                  <tr key={item.id} className="hover:bg-surfaceAlt/50">
                    <td className="py-3 px-6 font-bold text-textPrimary">{item.asset_tag}</td>
                    <td className="py-3 px-6 text-textPrimary">{item.name}</td>
                    <td className="py-3 px-6 text-textSecondary">
                      {item.acquisition_date ? item.acquisition_date.split('T')[0] : '—'}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                        {item.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
