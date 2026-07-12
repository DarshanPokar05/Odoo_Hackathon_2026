import client from './client';

export const activityLogsApi = {
  list: async (params) => {
    const response = await client.get('/activityLogs', { params });
    return response.data;
  },
};
