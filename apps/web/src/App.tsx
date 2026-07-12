import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AssetListPage } from './modules/asset/pages/AssetListPage';
import { CreateAssetPage } from './modules/asset/pages/CreateAssetPage';
import { EditAssetPage } from './modules/asset/pages/EditAssetPage';
import { AssetDetailsPage } from './modules/asset/pages/AssetDetailsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">AssetFlow</h1>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/assets" replace />} />
              <Route path="/assets" element={<AssetListPage />} />
              <Route path="/assets/new" element={<CreateAssetPage />} />
              <Route path="/assets/:id" element={<AssetDetailsPage />} />
              <Route path="/assets/:id/edit" element={<EditAssetPage />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
