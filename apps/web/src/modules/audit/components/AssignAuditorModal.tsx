import { useState } from 'react';
import { useAssignAuditors } from '../api';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';

export function AssignAuditorModal({ auditId, onClose }: { auditId: string, onClose: () => void }) {
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  const { mutate: assignAuditors, isPending } = useAssignAuditors(auditId);
  
  const { data: users } = useQuery({
    queryKey: ['users', 'auditors'],
    queryFn: () => fetchApi<unknown[]>('/users?role=AUDITOR'), // Assume we can filter by role or just get all users
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    assignAuditors(
      { auditorIds: selectedAuditors },
      { onSuccess: () => onClose() }
    );
  };

  const toggleAuditor = (id: string) => {
    setSelectedAuditors(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Assign Auditors</h3>
              
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                {users?.map(user => (
                  <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedAuditors.includes(user.id)}
                      onChange={() => toggleAuditor(user.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">{user.firstName} {user.lastName} ({user.email})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isPending || selectedAuditors.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isPending ? 'Assigning...' : 'Assign'}
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
}
