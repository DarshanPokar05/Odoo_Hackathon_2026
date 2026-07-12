import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Allocation, AllocateAssetDTO, ReturnAssetDTO, TransferRequestDTO } from './types';

// Fetch all active allocations
export const useActiveAllocations = () => {
  return useQuery({
    queryKey: ['allocations', 'active'],
    queryFn: async (): Promise<Allocation[]> => {
      return fetchApi('/allocations');
    },
  });
};

// Fetch overdue allocations
export const useOverdueAllocations = () => {
  return useQuery({
    queryKey: ['allocations', 'overdue'],
    queryFn: async (): Promise<Allocation[]> => {
      return fetchApi('/allocations/overdue');
    },
  });
};

// Fetch allocation details
export const useAllocationDetails = (id: string) => {
  return useQuery({
    queryKey: ['allocations', id],
    queryFn: async (): Promise<Allocation> => {
      return fetchApi(`/allocations/${id}`);
    },
    enabled: !!id,
  });
};

// Allocate Asset
export const useAllocateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AllocateAssetDTO) => {
      return fetchApi('/allocations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Return Asset
export const useReturnAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReturnAssetDTO }) => {
      return fetchApi(`/allocations/${id}/return`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Request Transfer
export const useRequestTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransferRequestDTO) => {
      return fetchApi('/allocations/transfers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
};
