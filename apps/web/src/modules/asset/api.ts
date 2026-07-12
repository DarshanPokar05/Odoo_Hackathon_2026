import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { Asset, AssetHistory } from './types';

export interface UseAssetsParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useAssets(params: UseAssetsParams) {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    ...(params.search && { search: params.search }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.status && { status: params.status }),
    ...(params.condition && { condition: params.condition }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });

  return useQuery<{ assets: Asset[]; total: number }>({
    queryKey: ['assets', params],
    queryFn: () => fetchApi(`/assets?${queryParams.toString()}`),
  });
}

export function useCategories() {
  return useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => fetchApi('/organization/categories'),
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
