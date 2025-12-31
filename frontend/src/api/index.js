// ================================================
// FILE: frontend/src/api/index.js - COMPLETE WITH DISCOUNT SUPPORT
// ================================================
import api from './client';

// ==================== DASHBOARD API ====================
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

// ==================== CUSTOMERS API ====================
export const customersAPI = {
  getAll: (params = {}) => 
    api.get('/customers', { params }).then(res => res.data),
  getById: (id) =>
    api.get(`/customers/${id}`).then(res => res.data),
  create: (data) =>
    api.post('/customers', data).then(res => res.data),
  createWithSubscription: (data) =>
    api.post('/customers/with-subscription', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id) =>
    api.delete(`/customers/${id}`).then(res => res.data),
};

// ==================== PACKAGES API ====================
export const packagesAPI = {
  getAll: () => 
    api.get('/packages').then(res => res.data),
  getById: (id) =>
    api.get(`/packages/${id}`).then(res => res.data),
  create: (data) =>
    api.post('/packages', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/packages/${id}`, data).then(res => res.data),
  delete: (id) =>
    api.delete(`/packages/${id}`).then(res => res.data),
};

// ==================== INVOICES API (WITH DISCOUNT SUPPORT) ====================
export const invoicesAPI = {
  getAll: (params = {}) => 
    api.get('/invoices', { params }).then(res => res.data),
  getById: (id) =>
    api.get(`/invoices/${id}`).then(res => res.data),
  getOverdue: () =>
    api.get('/invoices/overdue').then(res => res.data),
  create: (data) =>
    api.post('/invoices/create', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/invoices/${id}`, data).then(res => res.data),
  updateStatus: (id, status) =>
    api.put(`/invoices/${id}/status`, { status }).then(res => res.data),
  delete: (id) =>
    api.delete(`/invoices/${id}`).then(res => res.data),
};

// ==================== PAYMENTS API ====================
export const paymentsAPI = {
  getAll: () => 
    api.get('/payments').then(res => res.data),
  getById: (id) =>
    api.get(`/payments/${id}`).then(res => res.data),
  create: (data) =>
    api.post('/payments', data).then(res => res.data),
  delete: (id) =>
    api.delete(`/payments/${id}`).then(res => res.data),
};

// ==================== SUBSCRIPTIONS API ====================
export const subscriptionsAPI = {
  getAll: (params = {}) =>
    api.get('/subscriptions', { params }).then(res => res.data),
  getById: (id) =>
    api.get(`/subscriptions/${id}`).then(res => res.data),
  getByCustomer: (customerId) =>
    api.get(`/subscriptions/customer/${customerId}`).then(res => res.data),
  create: (data) =>
    api.post('/subscriptions', data).then(res => res.data),
  update: (id, data) =>
    api.put(`/subscriptions/${id}`, data).then(res => res.data),
  delete: (id) =>
    api.delete(`/subscriptions/${id}`).then(res => res.data),
};

// ==================== SETTINGS API ====================
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

// ==================== REPORTS API ====================
export const reportsAPI = {
  getRevenue: (params = {}) =>
    api.get('/reports/revenue', { params }).then(res => res.data),
  getCustomerStats: (params = {}) =>
    api.get('/reports/customers', { params }).then(res => res.data),
  getPackageStats: (params = {}) =>
    api.get('/reports/packages', { params }).then(res => res.data),
  getPaymentStats: (params = {}) =>
    api.get('/reports/payments', { params }).then(res => res.data),
  exportData: (type, params = {}) =>
    api.get(`/reports/export/${type}`, { params, responseType: 'blob' }).then(res => res.data),
};

// ==================== EXPORT ALL ====================
export default {
  dashboardAPI,
  customersAPI,
  packagesAPI,
  invoicesAPI,
  paymentsAPI,
  subscriptionsAPI,
  settingsAPI,
  reportsAPI,
};
