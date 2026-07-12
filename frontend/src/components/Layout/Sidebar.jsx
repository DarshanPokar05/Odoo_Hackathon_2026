import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  ArrowLeftRight,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Organization Setup', path: '/org-setup', icon: Settings, adminOnly: true },
  { label: 'Assets', path: '/assets', icon: Box },
  { label: 'Allocation & Transfer', path: '/allocations', icon: ArrowLeftRight },
  { label: 'Resource Booking', path: '/bookings', icon: CalendarDays },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench },
  { label: 'Audits', path: '/audits', icon: ClipboardCheck },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Activity Logs', path: '/activity-logs', icon: Activity },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside
      className={`border-r border-border bg-surface flex flex-col transition-all duration-150 sticky top-0 h-screen z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Header */}
      <div className="h-16 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-accent text-surface font-display font-bold flex items-center justify-center shrink-0 text-sm">
            AF
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base tracking-tight text-textPrimary whitespace-nowrap">
              AssetFlow
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[8px] hover:bg-surfaceAlt text-textSecondary hover:text-textPrimary transition-colors"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === 'Admin')
          .map((item) => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accentSoft text-accent border-l-2 border-accent'
                    : 'text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System tag */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-[11px] font-mono text-textSecondary">
            <div>SYSTEM: ASSETFLOW v1.0</div>
            <div className="text-[10px] text-status-available">● CONNECTED</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
