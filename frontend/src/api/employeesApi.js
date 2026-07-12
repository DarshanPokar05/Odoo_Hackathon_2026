import client from './client';

export const employeesApi = {
  list: async (params) => {
    const response = await client.get('/employees', { params });
    return response.data;
  },
  updateRole: async (id, role, departmentId) => {
    const response = await client.patch(`/employees/${id}/role`, { role, departmentId });
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await client.patch(`/employees/${id}/status`, { status });
    return response.data;
  },
};
