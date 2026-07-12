import React, { useState } from 'react';
import { useActiveAllocations, useOverdueAllocations } from '../api';
import { AllocationTable } from '../components/AllocationTable';
import { AllocateModal } from '../components/AllocateModal';
import { ReturnModal } from '../components/ReturnModal';

export const AllocationListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'overdue'>('active');
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  
  const [returnAllocationId, setReturnAllocationId] = useState<string | null>(null);

  const { data: activeAllocations, isLoading: loadingActive } = useActiveAllocations();
  const { data: overdueAllocations, isLoading: loadingOverdue } = useOverdueAllocations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Allocations</h1>
        <button
          onClick={() => setIsAllocateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          Allocate Asset
        </button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('active')}
            className={`${
              activeTab === 'active'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active Allocations
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`${
              activeTab === 'overdue'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overdue
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'active' && (
          loadingActive ? (
            <div className="text-gray-500">Loading active allocations...</div>
          ) : (
            <AllocationTable 
              allocations={activeAllocations || []} 
              onReturn={(id) => setReturnAllocationId(id)}
            />
          )
        )}
        
        {activeTab === 'overdue' && (
          loadingOverdue ? (
            <div className="text-gray-500">Loading overdue allocations...</div>
          ) : (
            <AllocationTable 
              allocations={overdueAllocations || []} 
              onReturn={(id) => setReturnAllocationId(id)}
            />
          )
        )}
      </div>

      <AllocateModal 
        isOpen={isAllocateModalOpen} 
        onClose={() => setIsAllocateModalOpen(false)} 
      />

      <ReturnModal 
        isOpen={!!returnAllocationId}
        onClose={() => setReturnAllocationId(null)}
        allocationId={returnAllocationId}
      />
    </div>
  );
};
