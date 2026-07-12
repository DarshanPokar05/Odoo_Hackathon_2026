import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, LogIn } from 'lucide-react';

export function SessionExpiredPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-6 bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl text-center transition-all duration-300">
        <div className="mx-auto w-12 h-12 bg-warning/15 text-warning rounded-full flex items-center justify-center animate-pulse">
          <AlertTriangle className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Session Expired
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your login session has expired due to inactivity or invalid credentials. Please sign in again to resume your work.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/login"
            className="w-full flex items-center justify-center py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/95 active:scale-[0.99] transition-all"
          >
            <LogIn className="h-4.5 w-4.5 mr-2" />
            Sign back in
          </Link>
        </div>
      </div>
    </div>
  );
}
export default SessionExpiredPage;
