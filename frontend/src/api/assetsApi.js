import client from './client';

export const assetsApi = {
  list: async (params) => {
    const response = await client.get('/assets', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await client.get(`/assets/${id}`);
    return response.data;
  },
  getHistory: async (id) => {
    const response = await client.get(`/assets/${id}/history`);
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/assets', data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await client.patch(`/assets/${id}/status`, { status });
    return response.data;
  },
};
