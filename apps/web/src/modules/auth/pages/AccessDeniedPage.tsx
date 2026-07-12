import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-xl text-center space-y-6">
        <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <span className="text-xs font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-2.5 py-1 rounded-full">
            Error 403
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            Access Denied
          </h1>
          <p className="text-sm text-muted-foreground">
            You do not have the required permissions to view this page. If you believe this is an error, please contact your administrator.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-xl text-sm border border-border/50 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow hover:bg-primary/95 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
export default AccessDeniedPage;
