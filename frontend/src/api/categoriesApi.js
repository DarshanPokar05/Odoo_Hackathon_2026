import client from './client';

export const categoriesApi = {
  list: async () => {
    const response = await client.get('/categories');
    return response.data;
  },
  getById: async (id) => {
    const response = await client.get(`/categories/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/categories', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await client.put(`/categories/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await client.delete(`/categories/${id}`);
    return response.data;
  },
};
