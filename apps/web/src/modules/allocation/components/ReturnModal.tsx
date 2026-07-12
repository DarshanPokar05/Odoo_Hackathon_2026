import React, { useState } from 'react';
import { useReturnAsset } from '../api';
import { Condition } from '../types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocationId: string | null;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, allocationId }) => {
  const { mutate: returnAsset, isPending } = useReturnAsset();

  const [conditionAfter, setConditionAfter] = useState<Condition>('GOOD');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !allocationId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    returnAsset(
      { id: allocationId, data: { conditionAfter, remarks } },
      {
        onSuccess: () => {
          onClose();
          setConditionAfter('GOOD');
          setRemarks('');
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          setError(error.response?.data?.message || 'Failed to return asset');
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
                Return Asset
              </h3>
              
              {error && (
                <div className="mt-2 bg-red-50 p-2 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition After</label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={conditionAfter}
                    onChange={(e) => setConditionAfter(e.target.value as Condition)}
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="BROKEN">Broken</option>
                  </select>
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
                {isPending ? 'Processing...' : 'Return Asset'}
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
