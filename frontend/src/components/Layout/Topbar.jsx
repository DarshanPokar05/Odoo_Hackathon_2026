import React, { useState } from 'react';
import { Sun, Moon, Search, Bell, User, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { TagChip } from '../TagChip';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/assets':
      return 'Assets Directory';
    case '/allocations':
      return 'Allocation & Transfer';
    case '/bookings':
      return 'Resource Booking';
    case '/maintenance':
      return 'Maintenance Management';
    case '/audits':
      return 'Audits & Reconciliation';
    case '/reports':
      return 'Reports & Analytics';
    case '/activity-logs':
      return 'Activity Logs & Notifications';
    default:
      return 'AssetFlow';
  }
};

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-center space-x-3">
        <span className="font-mono text-xs text-textSecondary uppercase tracking-wider">AssetFlow /</span>
        <h1 className="font-display font-semibold text-lg text-textPrimary">{pageTitle}</h1>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search asset tag, serial, or employee..."
            className="w-full bg-bg border border-border rounded-[8px] pl-9 pr-4 py-1.5 text-sm font-sans text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Right Actions: Notifications, Theme Toggle, User Profile */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-[8px] hover:bg-surfaceAlt text-textSecondary hover:text-textPrimary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-overdue" />
        </button>

        {/* Theme Toggle (Sun/Moon icon) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-[8px] hover:bg-surfaceAlt text-textSecondary hover:text-textPrimary transition-colors flex items-center justify-center"
          aria-label="Toggle Theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-accent" />}
        </button>

        {/* Role Badge + Avatar Menu */}
        <div className="relative">
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-[8px] hover:bg-surfaceAlt transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accentSoft border border-border flex items-center justify-center font-mono font-semibold text-xs text-textPrimary">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AF'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-textPrimary leading-tight">{user?.name || 'Employee'}</span>
              <span className="text-[10px] font-mono uppercase text-textSecondary">{user?.role || 'user'}</span>
            </div>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-[8px] shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs font-medium text-textPrimary">{user?.email}</p>
                <div className="mt-1">
                  <TagChip status={user?.role || 'EMPLOYEE'} />
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-xs text-status-lost hover:bg-surfaceAlt flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
