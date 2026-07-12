import client from './client';

export const dashboardApi = {
  getSummary: async () => {
    const response = await client.get('/dashboard');
    return response.data;
  },
};
