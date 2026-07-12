import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Bell, Moon, Sun, User, Laptop } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b border-border h-16 flex items-center">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile menu button could go here */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Laptop className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">AssetFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            {theme === 'light' ? <Sun className="w-5 h-5" /> : theme === 'dark' ? <Moon className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
          </button>
          
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background"></span>
          </button>

          <div className="h-6 w-px bg-border mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium leading-none mb-1">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-muted-foreground leading-none">{user?.role?.replace('_', ' ')}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-semibold border border-border">
              {user?.firstName?.[0] || <User className="w-4 h-4" />}
            </div>
            {/* Very basic logout for now, could be in a dropdown */}
            <button onClick={logout} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
