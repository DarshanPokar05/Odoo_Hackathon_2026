import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/services/api';
import { toast } from 'sonner';
import {
  AuditCycle,
  CreateAuditRequest,
  AssignAuditorRequest,
  VerifyAssetsRequest,
  CloseAuditRequest,
  AuditStatus
} from './types';

const AUDIT_KEYS = {
  all: ['audits'] as const,
  lists: (filters?: unknown) => [...AUDIT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...AUDIT_KEYS.all, 'detail', id] as const,
  report: (id: string) => [...AUDIT_KEYS.all, 'report', id] as const,
};

export function useAudits(filters?: { departmentId?: string; status?: AuditStatus }) {
  return useQuery({
    queryKey: AUDIT_KEYS.lists(filters),
    queryFn: () => {
      const queryParams = new URLSearchParams();
      if (filters?.departmentId) queryParams.append('departmentId', filters.departmentId);
      if (filters?.status) queryParams.append('status', filters.status);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi<AuditCycle[]>(`/audits${queryString}`);
    },
  });
}

export function useAuditDetails(id: string) {
  return useQuery({
    queryKey: AUDIT_KEYS.detail(id),
    queryFn: () => fetchApi<unknown>(`/audits/${id}`),
    enabled: !!id,
  });
}

export function useAuditReport(id: string) {
  return useQuery({
    queryKey: AUDIT_KEYS.report(id),
    queryFn: () => fetchApi<unknown>(`/audits/${id}/report`),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAuditRequest) => fetchApi<AuditCycle>('/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() });
      toast.success('Audit cycle created successfully');
    },
    onError: (error: unknown) => {
      toast.error(error.message || 'Failed to create audit cycle');
    },
  });
}

export function useAssignAuditors(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignAuditorRequest) => fetchApi<unknown>(`/audits/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() });
      toast.success('Auditors assigned successfully');
    },
    onError: (error: unknown) => {
      toast.error(error.message || 'Failed to assign auditors');
    },
  });
}

export function useVerifyAssets(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyAssetsRequest) => fetchApi<unknown>(`/audits/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(id) });
      toast.success('Assets verified successfully');
    },
    onError: (error: unknown) => {
      toast.error(error.message || 'Failed to verify assets');
    },
  });
}

export function useCloseAudit(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CloseAuditRequest) => fetchApi<AuditCycle>(`/audits/${id}/close`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.lists() });
      toast.success('Audit cycle closed successfully');
    },
    onError: (error: unknown) => {
      toast.error(error.message || 'Failed to close audit cycle');
    },
  });
}
