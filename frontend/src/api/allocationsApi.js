import client from './client';

export const allocationsApi = {
  list: async (params) => {
    const response = await client.get('/allocations', { params });
    return response.data;
  },
  listOverdue: async () => {
    const response = await client.get('/allocations/overdue');
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/allocations', data);
    return response.data;
  },
  returnAsset: async (id, conditionCheckinNotes) => {
    const response = await client.post(`/allocations/${id}/return`, { conditionCheckinNotes });
    return response.data;
  },
  listTransfers: async (params) => {
    const response = await client.get('/transfers', { params });
    return response.data;
  },
  createTransfer: async (data) => {
    const response = await client.post('/transfers', data);
    return response.data;
  },
  approveTransfer: async (id) => {
    const response = await client.patch(`/transfers/${id}/approve`);
    return response.data;
  },
  rejectTransfer: async (id) => {
    const response = await client.patch(`/transfers/${id}/reject`);
    return response.data;
  },
};
