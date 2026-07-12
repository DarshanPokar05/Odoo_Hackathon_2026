import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Laptop, 
  ArrowRightLeft,
  CalendarCheck,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  History
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organization', href: '/organization', icon: Building2, roles: ['ADMIN'] },
  { name: 'Assets', href: '/assets', icon: Laptop },
  { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft },
  { name: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, roles: ['ADMIN', 'ASSET_MANAGER'] },
  { name: 'Audits', href: '/audits', icon: ClipboardCheck, roles: ['ADMIN', 'ASSET_MANAGER'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'DEPARTMENT_HEAD'] },
  { name: 'Activity Logs', href: '/activity-logs', icon: History, roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuthStore();

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300">
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-muted/50 rounded-xl p-4 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <span className="text-primary font-bold">{user?.organizationId ? 'AF' : 'Org'}</span>
          </div>
          <p className="text-sm font-semibold text-foreground">AssetFlow Enterprise</p>
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
