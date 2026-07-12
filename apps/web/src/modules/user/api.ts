import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';
import { User } from './types';

export function useEmployees() {
  return useQuery<{ users: User[]; total: number }>({
    queryKey: ['users'],
    queryFn: () => fetchApi('/users'),
  });
}
