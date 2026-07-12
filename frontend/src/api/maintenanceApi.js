import client from './client';

export const maintenanceApi = {
  list: async (params) => {
    const response = await client.get('/maintenance', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/maintenance', data);
    return response.data;
  },
  approve: async (id) => {
    const response = await client.patch(`/maintenance/${id}/approve`);
    return response.data;
  },
  reject: async (id) => {
    const response = await client.patch(`/maintenance/${id}/reject`);
    return response.data;
  },
  assignTechnician: async (id, technicianName) => {
    const response = await client.patch(`/maintenance/${id}/assign-technician`, { technicianName });
    return response.data;
  },
  start: async (id) => {
    const response = await client.patch(`/maintenance/${id}/start`);
    return response.data;
  },
  resolve: async (id) => {
    const response = await client.patch(`/maintenance/${id}/resolve`);
    return response.data;
  },
};
