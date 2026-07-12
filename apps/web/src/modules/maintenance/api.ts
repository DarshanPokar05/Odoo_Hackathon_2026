import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { toast } from 'sonner';
import {
  MaintenanceRequest,
  RaiseMaintenanceDTO,
  ApproveMaintenanceDTO,
  RejectMaintenanceDTO,
  AssignTechnicianDTO,
  ResolveMaintenanceDTO,
  CloseMaintenanceDTO
} from './types';

const MAINTENANCE_KEYS = {
  all: ['maintenance'] as const,
  lists: () => [...MAINTENANCE_KEYS.all, 'list'] as const,
  pending: () => [...MAINTENANCE_KEYS.all, 'pending'] as const,
  detail: (id: string) => [...MAINTENANCE_KEYS.all, 'detail', id] as const,
};

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.lists(),
    queryFn: () => fetchApi<MaintenanceRequest[]>('/maintenance'),
  });
}

export function usePendingMaintenanceRequests() {
  return useQuery({
    queryKey: MAINTENANCE_KEYS.pending(),
    queryFn: () => fetchApi<MaintenanceRequest[]>('/maintenance/pending'),
  });
}

export function useRaiseMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RaiseMaintenanceDTO) => fetchApi<MaintenanceRequest>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Maintenance request raised successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to raise maintenance request');
    },
  });
}

export function useApproveMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveMaintenanceDTO }) =>
      fetchApi<MaintenanceRequest>(`/maintenance/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Maintenance request approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

export function useRejectMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectMaintenanceDTO }) =>
      fetchApi<MaintenanceRequest>(`/maintenance/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Maintenance request rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTechnicianDTO }) =>
      fetchApi<MaintenanceRequest>(`/maintenance/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Technician assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign technician');
    },
  });
}

export function useResolveMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveMaintenanceDTO }) =>
      fetchApi<MaintenanceRequest>(`/maintenance/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Maintenance resolved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resolve maintenance');
    },
  });
}

export function useCloseMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseMaintenanceDTO }) =>
      fetchApi<MaintenanceRequest>(`/maintenance/${id}/close`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_KEYS.all });
      toast.success('Maintenance closed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close maintenance');
    },
  });
}
