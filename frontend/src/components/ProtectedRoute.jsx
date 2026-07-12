import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-sm font-mono text-textSecondary uppercase tracking-wider animate-pulse">
          Authenticating AssetFlow...
        </div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 bg-surface border border-border rounded-[8px] max-w-md mx-auto mt-12 text-center">
        <h2 className="font-display font-bold text-lg text-status-lost">Access Forbidden</h2>
        <p className="text-sm text-textSecondary mt-2">
          Your role ({user.role}) does not have permission to access this screen.
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
