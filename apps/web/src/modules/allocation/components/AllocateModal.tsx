import React, { useState } from 'react';
import { useAllocateAsset } from '../api';
import { useAssets } from '../../asset/api';
import { useEmployees } from '../../user/api';

interface AllocateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AllocateModal: React.FC<AllocateModalProps> = ({ isOpen, onClose }) => {
  const { data: assetsData } = useAssets({ page: 1, limit: 100 });
  const { data: employeesData } = useEmployees();
  const { mutate: allocate, isPending } = useAllocateAsset();

  const [assetId, setAssetId] = useState('');
  const [allocatedTo, setAllocatedTo] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Only show AVAILABLE assets
  const availableAssets = assetsData?.assets?.filter(a => a.status === 'AVAILABLE') || [];
  
  // Only show ACTIVE employees
  const activeEmployees = employeesData?.users?.filter(e => e.status === 'ACTIVE') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !allocatedTo) {
      setError('Asset and Employee are required');
      return;
    }

    allocate(
      { assetId, allocatedTo, expectedReturnDate: expectedReturnDate || undefined, remarks },
      {
        onSuccess: () => {
          onClose();
          setAssetId('');
          setAllocatedTo('');
          setExpectedReturnDate('');
          setRemarks('');
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || 'Failed to allocate asset');
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Allocate Asset
              </h3>
              
              {error && (
                <div className="mt-2 bg-red-50 p-2 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset</label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                  >
                    <option value="">Select Asset</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.assetTag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={allocatedTo}
                    onChange={(e) => setAllocatedTo(e.target.value)}
                  >
                    <option value="">Select Employee</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                  <textarea
                    rows={3}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isPending ? 'Allocating...' : 'Allocate'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
