import client from './client';

export const auditsApi = {
  list: async (params) => {
    const response = await client.get('/audits', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await client.get(`/audits/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/audits', data);
    return response.data;
  },
  assignAuditors: async (id, auditorIds) => {
    const response = await client.post(`/audits/${id}/auditors`, { auditorIds });
    return response.data;
  },
  start: async (id) => {
    const response = await client.post(`/audits/${id}/start`);
    return response.data;
  },
  updateItem: async (cycleId, itemId, data) => {
    const response = await client.patch(`/audits/${cycleId}/items/${itemId}`, data);
    return response.data;
  },
  close: async (id) => {
    const response = await client.post(`/audits/${id}/close`);
    return response.data;
  },
  getDiscrepancies: async (id) => {
    const response = await client.get(`/audits/${id}/discrepancies`);
    return response.data;
  },
};
