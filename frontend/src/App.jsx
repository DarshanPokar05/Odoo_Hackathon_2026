import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Allocations } from './pages/Allocations';
import { Bookings } from './pages/Bookings';
import { Maintenance } from './pages/Maintenance';
import { Audits } from './pages/Audits';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { OrgSetup } from './pages/OrgSetup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected App Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="org-setup" element={<OrgSetup />} />
                <Route path="assets" element={<Assets />} />
                <Route path="allocations" element={<Allocations />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="audits" element={<Audits />} />
                <Route path="reports" element={<Reports />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
