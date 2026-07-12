import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ProtectedLayout } from '@/layouts/ProtectedLayout';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

import { AssetListPage } from '@/modules/asset/pages/AssetListPage';
import { CreateAssetPage } from '@/modules/asset/pages/CreateAssetPage';
import { EditAssetPage } from '@/modules/asset/pages/EditAssetPage';
import { AssetDetailsPage } from '@/modules/asset/pages/AssetDetailsPage';

// Temporary Mock Pages for Routing Setup
const MockLogin = () => <div className="p-8 bg-card rounded-xl border border-border shadow-sm text-center"><h2 className="text-2xl font-bold mb-4">Login Page</h2><button className="px-4 py-2 bg-primary text-primary-foreground rounded-md" onClick={() => localStorage.setItem('auth_token', 'mock_token')}>Mock Login</button></div>;
const MockDashboard = () => <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="mt-4 text-muted-foreground">Welcome to AssetFlow.</p></div>;
const MockNotFound = () => <div><h1 className="text-3xl font-bold">404 - Not Found</h1></div>;

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<MockLogin />} />
            <Route path="/forgot-password" element={<div>Forgot Password</div>} />
          </Route>
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<MockDashboard />} />
            <Route path="/organization" element={<div>Organization</div>} />
            <Route path="/assets" element={<AssetListPage />} />
            <Route path="/assets/new" element={<CreateAssetPage />} />
            <Route path="/assets/:id" element={<AssetDetailsPage />} />
            <Route path="/assets/:id/edit" element={<EditAssetPage />} />
            <Route path="/transfers" element={<div>Transfers</div>} />
            <Route path="/bookings" element={<div>Bookings</div>} />
            <Route path="/maintenance" element={<div>Maintenance</div>} />
            <Route path="/audits" element={<div>Audits</div>} />
            <Route path="/reports" element={<div>Reports</div>} />
            <Route path="/activity-logs" element={<div>Activity Logs</div>} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<MockNotFound />} />
      </Routes>
    </Suspense>
  );
}
