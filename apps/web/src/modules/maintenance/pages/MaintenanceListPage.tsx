import { useState } from 'react';
import { useMaintenanceRequests } from '../api';

import { RaiseMaintenanceModal } from '../components/RaiseMaintenanceModal';
import { MaintenanceActionButtons } from '../components/MaintenanceActionButtons';

export function MaintenanceListPage() {
  const { data: requests, isLoading } = useMaintenanceRequests();
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maintenance Requests</h2>
          <p className="text-muted-foreground">Manage and track asset maintenance</p>
        </div>
        <button 
          onClick={() => setIsRaiseModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Raise Request
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">Loading maintenance requests...</td>
              </tr>
            ) : requests?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No maintenance requests found.</td>
              </tr>
            ) : (
              requests?.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.asset?.name || req.assetId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${req.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 
                        req.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                        req.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <MaintenanceActionButtons request={req} onActionComplete={() => {}} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RaiseMaintenanceModal 
        isOpen={isRaiseModalOpen} 
        onClose={() => setIsRaiseModalOpen(false)} 
      />
    </div>
  );
}
