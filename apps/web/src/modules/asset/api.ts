import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Asset, AssetHistory } from './types';

export function useAssets(params: { page: number; limit: number; search?: string }) {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    ...(params.search && { search: params.search }),
  });

  return useQuery<{ assets: Asset[]; total: number }>({
    queryKey: ['assets', params],
    queryFn: () => fetchApi(`/assets?${queryParams.toString()}`),
  });
}

export function useAsset(id: string) {
  return useQuery<Asset>({
    queryKey: ['assets', id],
    queryFn: () => fetchApi(`/assets/${id}`),
    enabled: !!id,
  });
}

export function useAssetTimeline(id: string) {
  return useQuery<AssetHistory[]>({
    queryKey: ['assets', id, 'timeline'],
    queryFn: () => fetchApi(`/assets/${id}/history`),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Asset>) =>
      fetchApi('/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) =>
      fetchApi(`/assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/assets/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
