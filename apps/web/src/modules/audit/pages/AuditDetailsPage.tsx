import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuditDetails, useCloseAudit } from '../api';
import { AssignAuditorModal } from '../components/AssignAuditorModal';
import { VerifyAssetDrawer } from '../components/VerifyAssetDrawer';

export function AuditDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: audit, isLoading } = useAuditDetails(id!);
  const { mutate: closeAudit } = useCloseAudit(id!);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isVerifyDrawerOpen, setIsVerifyDrawerOpen] = useState(false);

  if (isLoading) return <div>Loading audit details...</div>;
  if (!audit) return <div>Audit not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{audit.title}</h2>
          <p className="text-muted-foreground">Department: {audit.department?.name}</p>
          <div className="mt-2">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${audit.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                audit.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 
                'bg-red-100 text-red-800'}`}>
              {audit.status}
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          {audit.status !== 'CLOSED' && (
            <>
              <button 
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Assign Auditors
              </button>
              {audit.status === 'ACTIVE' && (
                <button 
                  onClick={() => setIsVerifyDrawerOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Verify Assets
                </button>
              )}
              {audit.status === 'ACTIVE' && (
                <button 
                  onClick={() => {
                    if(confirm('Are you sure you want to close this audit?')) {
                      closeAudit({});
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Close Audit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Auditors List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Auditors</h3>
          {audit.assignments?.length === 0 ? (
            <p className="text-gray-500">No auditors assigned yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {audit.assignments?.map((assignment: { id: string; auditor: { firstName: string; lastName: string; email: string } }) => (
                <li key={assignment.id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assignment.auditor.firstName} {assignment.auditor.lastName}</p>
                    <p className="text-sm text-gray-500">{assignment.auditor.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Audit Items List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Items</h3>
          {audit.items?.length === 0 ? (
            <p className="text-gray-500">No items verified yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {audit.items?.map((item: { id: string; asset: { name: string; assetTag: string }; verificationStatus: string; remarks?: string }) => (
                <li key={item.id} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.asset.name}</p>
                      <p className="text-sm text-gray-500">{item.asset.assetTag}</p>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : 
                        item.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {item.verificationStatus}
                    </span>
                  </div>
                  {item.remarks && <p className="text-sm text-gray-500 mt-1">Remarks: {item.remarks}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isAssignModalOpen && (
        <AssignAuditorModal auditId={audit.id} onClose={() => setIsAssignModalOpen(false)} />
      )}
      {isVerifyDrawerOpen && (
        <VerifyAssetDrawer auditId={audit.id} onClose={() => setIsVerifyDrawerOpen(false)} />
      )}
    </div>
  );
}
