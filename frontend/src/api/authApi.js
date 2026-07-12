import client from './client';

export const authApi = {
  login: async (credentials) => {
    const response = await client.post('/auth/login', credentials);
    return response.data;
  },
  signup: async (data) => {
    const response = await client.post('/auth/signup', data);
    return response.data;
  },
  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
  forgotPassword: async (email) => {
    const response = await client.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await client.post('/auth/reset-password', data);
    return response.data;
  },
  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },
};
