import React from 'react';
import { MaintenanceRequest, MaintenanceStatus } from '../types';
import { 
  useApproveMaintenance, 
  useRejectMaintenance, 
  useResolveMaintenance, 
  useCloseMaintenance 
} from '../api';

interface Props {
  request: MaintenanceRequest;
  onActionComplete: () => void;
}

export function MaintenanceActionButtons({ request, onActionComplete }: Props) {
  const approveMutation = useApproveMaintenance();
  const rejectMutation = useRejectMaintenance();
  const resolveMutation = useResolveMaintenance();
  const closeMutation = useCloseMaintenance();

  const handleApprove = () => {
    approveMutation.mutate({ id: request.id, data: { remarks: 'Approved from dashboard' } }, { onSuccess: onActionComplete });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: request.id, data: { remarks: 'Rejected from dashboard' } }, { onSuccess: onActionComplete });
  };

  const handleResolve = () => {
    resolveMutation.mutate({ id: request.id, data: { remarks: 'Resolved issue successfully' } }, { onSuccess: onActionComplete });
  };

  const handleClose = () => {
    closeMutation.mutate({ id: request.id, data: { remarks: 'Closed by admin' } }, { onSuccess: onActionComplete });
  };

  return (
    <div className="flex gap-2 text-sm">
      {request.status === MaintenanceStatus.PENDING && (
        <>
          <button 
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="text-green-600 hover:text-green-900"
          >
            Approve
          </button>
          <button 
            onClick={handleReject}
            disabled={rejectMutation.isPending}
            className="text-red-600 hover:text-red-900"
          >
            Reject
          </button>
        </>
      )}

      {(request.status === MaintenanceStatus.ASSIGNED || request.status === MaintenanceStatus.IN_PROGRESS) && (
        <button 
          onClick={handleResolve}
          disabled={resolveMutation.isPending}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Resolve
        </button>
      )}

      {request.status === MaintenanceStatus.RESOLVED && (
        <button 
          onClick={handleClose}
          disabled={closeMutation.isPending}
          className="text-gray-600 hover:text-gray-900"
        >
          Close
        </button>
      )}
    </div>
  );
}
