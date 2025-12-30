const API_URL = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
};

export const dashboardAPI = {
  getStats: () => 
    fetch(`${API_URL}/dashboard/stats`).then(handleResponse),
  getRevenueChart: () => 
    fetch(`${API_URL}/dashboard/revenue-chart`).then(handleResponse),
  getCustomerGrowth: () => 
    fetch(`${API_URL}/dashboard/customer-growth`).then(handleResponse),
  getPackageDistribution: () => 
    fetch(`${API_URL}/dashboard/package-distribution`).then(handleResponse),
  getRecentActivity: () => 
    fetch(`${API_URL}/dashboard/recent-activity`).then(handleResponse),
};

export const customersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/customers?${queryString}`).then(handleResponse);
  },
  create: (data) =>
    fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const packagesAPI = {
  getAll: () => 
    fetch(`${API_URL}/packages`).then(handleResponse),
  create: (data) =>
    fetch(`${API_URL}/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  update: (id, data) =>
    fetch(`${API_URL}/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_URL}/packages/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const invoicesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetch(`${API_URL}/invoices?${queryString}`).then(handleResponse);
  },
  create: (data) =>
    fetch(`${API_URL}/invoices/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
  updateStatus: (id, status) =>
    fetch(`${API_URL}/invoices/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handleResponse),
  delete: (id) =>
    fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE' }).then(handleResponse),
};

export const paymentsAPI = {
  getAll: () => 
    fetch(`${API_URL}/payments`).then(handleResponse),
  create: (data) =>
    fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),
};
