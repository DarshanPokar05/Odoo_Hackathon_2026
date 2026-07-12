import client from './client';

export const bookingsApi = {
  list: async (params) => {
    const response = await client.get('/bookings', { params });
    return response.data;
  },
  getUpcomingReminders: async () => {
    const response = await client.get('/bookings/upcoming-reminders');
    return response.data;
  },
  create: async (data) => {
    const response = await client.post('/bookings', data);
    return response.data;
  },
  cancel: async (id) => {
    const response = await client.patch(`/bookings/${id}/cancel`);
    return response.data;
  },
  reschedule: async (id, data) => {
    const response = await client.patch(`/bookings/${id}/reschedule`, data);
    return response.data;
  },
};
