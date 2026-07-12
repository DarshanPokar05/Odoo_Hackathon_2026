import React from 'react';
import { Allocation } from '../types';

interface AllocationTableProps {
  allocations: Allocation[];
  onReturn?: (id: string) => void;
}

export const AllocationTable: React.FC<AllocationTableProps> = ({ allocations, onReturn }) => {
  if (allocations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        No allocations found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {allocations.map((allocation) => (
            <tr key={allocation.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{allocation.asset?.name || 'Unknown Asset'}</div>
                <div className="text-sm text-gray-500">{allocation.asset?.assetTag}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {allocation.userAllocatedTo?.firstName} {allocation.userAllocatedTo?.lastName}
                </div>
                <div className="text-sm text-gray-500">{allocation.userAllocatedTo?.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(allocation.allocationDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${allocation.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                  ${allocation.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : ''}
                  ${allocation.status === 'RETURNED' ? 'bg-gray-100 text-gray-800' : ''}
                  ${allocation.status === 'TRANSFERRED' ? 'bg-blue-100 text-blue-800' : ''}
                `}>
                  {allocation.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {(allocation.status === 'ACTIVE' || allocation.status === 'OVERDUE') && onReturn && (
                  <button
                    onClick={() => onReturn(allocation.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Return
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
