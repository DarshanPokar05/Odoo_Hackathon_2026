import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/shared/Header';
import { Sidebar } from '@/components/shared/Sidebar';
import { Footer } from '@/components/shared/Footer';

export function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto relative">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <div className="mt-auto">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
