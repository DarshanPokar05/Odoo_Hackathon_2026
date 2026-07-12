import client from './client';

export const reportsApi = {
  getUtilization: async () => {
    const response = await client.get('/reports/utilization');
    return response.data;
  },
  getMaintenanceFrequency: async () => {
    const response = await client.get('/reports/maintenance-frequency');
    return response.data;
  },
  getDueForMaintenanceOrRetirement: async () => {
    const response = await client.get('/reports/due-for-maintenance-or-retirement');
    return response.data;
  },
  getDepartmentAllocationSummary: async () => {
    const response = await client.get('/reports/department-allocation-summary');
    return response.data;
  },
  getBookingHeatmap: async () => {
    const response = await client.get('/reports/booking-heatmap');
    return response.data;
  },
  downloadExport: (type = 'utilization') => {
    const token = localStorage.getItem('access_token');
    const url = `/api/reports/export?type=${encodeURIComponent(type)}&format=csv`;
    window.open(url, '_blank');
  },
};
