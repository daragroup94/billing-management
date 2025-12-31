import api from './client';

export const dashboardAPI = {
  getStats: () => 
    api.get('/dashboard/stats').then(res => res.data),
  getRevenueChart: () => 
    api.get('/dashboard/revenue-chart').then(res => res.data),
  getCustomerGrowth: () => 
    api.get('/dashboard/customer-growth').then(res => res.data),
  getPackageDistribution: () => 
    api.get('/dashboard/package-distribution').then(res => res.data),
  getRecentActivity: () => 
    api.get('/dashboard/recent-activity').then(res => res.data),
};

export const customersAPI = {
  getAll: (params = {}) => 
    api.get('/customers', { params }).then(res => res.data),
  create: (data) =>
    api.post('/customers', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id) =>
    api.delete(`/customers/${id}`).then(res => res.data),
};

export const packagesAPI = {
  getAll: () => 
    api.get('/packages').then(res => res.data),
  create: (data) =>
    api.post('/packages', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/packages/${id}`, data).then(res => res.data),
  delete: (id) =>
    api.delete(`/packages/${id}`).then(res => res.data),
};

export const invoicesAPI = {
  getAll: (params = {}) => 
    api.get('/invoices', { params }).then(res => res.data),
  create: (data) =>
    api.post('/invoices/create', data).then(res => res.data),
  updateStatus: (id, status) =>
    api.put(`/invoices/${id}/status`, { status }).then(res => res.data),
  delete: (id) =>
    api.delete(`/invoices/${id}`).then(res => res.data),
};

export const paymentsAPI = {
  getAll: () => 
    api.get('/payments').then(res => res.data),
  create: (data) =>
    api.post('/payments', data).then(res => res.data),
};

export const settingsAPI = {
  getAll: () => 
    api.get('/settings').then(res => res.data),
  get: (key) => 
    api.get(`/settings/${key}`).then(res => res.data),
  update: (key, value, type) =>
    api.put(`/settings/${key}`, { value, type }).then(res => res.data),
  delete: (key) =>
    api.delete(`/settings/${key}`).then(res => res.data),
  reset: () =>
    api.post('/settings/reset').then(res => res.data),
  exportBackup: () =>
    api.get('/settings/export/backup').then(res => res.data),
  importRestore: (backup) =>
    api.post('/settings/import/restore', { backup }).then(res => res.data)
};
