import client from './client';

export const departmentsApi = {
  list: async (params) => {
    const response = await client.get('/departments', { params });
    return response.data;
  },
  getTree: async () => {
    const response = await client.get('/departments/tree');
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/departments', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await client.put(`/departments/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await client.patch(`/departments/${id}/status`, { status });
    return response.data;
  },
};
