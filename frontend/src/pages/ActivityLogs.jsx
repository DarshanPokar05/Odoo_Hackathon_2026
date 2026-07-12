import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { activityLogsApi } from '../api/activityLogsApi';
import { useAuth } from '../hooks/useAuth';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function getNotificationIcon(type = '') {
  const t = type.toLowerCase();
  if (t.includes('alert') || t.includes('discrepancy') || t.includes('lost')) return '⚠';
  if (t.includes('approval') || t.includes('maintenance')) return '✔';
  if (t.includes('booking')) return '📅';
  return '🔔';
}

export function ActivityLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'Admin';

  // Main screen tab view: 'notifications' | 'activity'
  const [mainTab, setMainTab] = useState('notifications');

  // Filter tab row for Notifications: 'All' | 'Alerts' | 'Approvals' | 'Bookings'
  const [notifFilter, setNotifFilter] = useState('All');

  // Fetch Notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });
  const rawNotifications = Array.isArray(notifData?.data?.items)
    ? notifData.data.items
    : Array.isArray(notifData?.data)
    ? notifData.data
    : [];

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'All') return rawNotifications;
    return rawNotifications.filter((n) => {
      const type = (n.type || '').toLowerCase();
      if (notifFilter === 'Alerts')
        return type.includes('alert') || type.includes('lost') || type.includes('discrepancy');
      if (notifFilter === 'Approvals') return type.includes('approval') || type.includes('maintenance');
      if (notifFilter === 'Bookings') return type.includes('booking');
      return true;
    });
  }, [rawNotifications, notifFilter]);

  // Fetch Activity Logs (Admin only)
  const [logEntityType, setLogEntityType] = useState('');
  const { data: logsData } = useQuery({
    queryKey: ['activityLogs', logEntityType],
    queryFn: () =>
      activityLogsApi.list({
        entity_type: logEntityType || undefined,
        limit: 50,
      }),
    enabled: Boolean(isAdmin && mainTab === 'activity'),
  });
  const activityLogs = Array.isArray(logsData?.data?.items)
    ? logsData.data.items
    : Array.isArray(logsData?.data)
    ? logsData.data
    : [];

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">
            Notifications & Activity Logs
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Real-time feed with client-side relative timestamps and audit log verification
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface p-1 rounded-[8px] border border-border">
          <button
            onClick={() => setMainTab('notifications')}
            className={`px-4 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
              mainTab === 'notifications'
                ? 'bg-accent text-bg font-bold'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            Notification Feed ({rawNotifications.length})
          </button>

          {isAdmin && (
            <button
              onClick={() => setMainTab('activity')}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-mono transition-all ${
                mainTab === 'activity'
                  ? 'bg-accent text-bg font-bold'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              System Activity Logs (Admin)
            </button>
          )}
        </div>
      </div>

      {mainTab === 'notifications' ? (
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden space-y-4 p-6">
          {/* Filter Tab Row (All / Alerts / Approvals / Bookings) & Mark All Read */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              {['All', 'Alerts', 'Approvals', 'Bookings'].map((f) => (
                <button
                  key={f}
                  onClick={() => setNotifFilter(f)}
                  className={`px-3 py-1 rounded-[6px] text-xs font-mono border transition-all ${
                    notifFilter === f
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-border text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {rawNotifications.some((n) => !n.is_read) && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-mono text-accent hover:underline"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* NOTIFICATION FEED WITH RELATIVE TIMESTAMPS */}
          <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-textSecondary">
                No notifications match the current filter.
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const unread = !notif.is_read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (unread) markReadMutation.mutate(notif.id);
                    }}
                    className={`p-4 rounded-[6px] border flex items-start justify-between gap-4 cursor-pointer transition-all ${
                      unread
                        ? 'bg-accent/10 border-accent/40 text-textPrimary font-semibold shadow-sm'
                        : 'bg-surfaceAlt border-border text-textSecondary opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base leading-none">
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-accent">
                            {notif.type || 'SYSTEM'}
                          </span>
                          {unread && (
                            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                          )}
                        </div>
                        <p className="text-xs mt-1 leading-relaxed">
                          {notif.message || notif.title}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-textSecondary whitespace-nowrap text-right">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* SYSTEM ACTIVITY LOGS TABLE (ADMIN ONLY) */
        <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-textPrimary">
              Enterprise Activity Log Feed
            </h3>

            <select
              value={logEntityType}
              onChange={(e) => setLogEntityType(e.target.value)}
              className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary"
            >
              <option value="">All Entity Types</option>
              <option value="AuditCycle">AuditCycle</option>
              <option value="AuditItem">AuditItem</option>
              <option value="Asset">Asset</option>
              <option value="Booking">Booking</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surfaceAlt text-[11px] font-mono uppercase text-textSecondary">
                  <th className="py-3 px-6">Timestamp (Relative)</th>
                  <th className="py-3 px-6">User / Actor</th>
                  <th className="py-3 px-6">Action Performed</th>
                  <th className="py-3 px-6">Entity Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-mono">
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-textSecondary">
                      No activity logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surfaceAlt/50">
                      <td className="py-3 px-6 text-textSecondary whitespace-nowrap">
                        {formatRelativeTime(log.created_at)}
                      </td>
                      <td className="py-3 px-6 text-textPrimary font-bold">
                        {log.user_name || log.user_email || 'System'}
                      </td>
                      <td className="py-3 px-6 text-textPrimary">{log.action}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] text-accent">
                          {log.entity_type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityLogs;
