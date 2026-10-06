import axios from 'axios';

const resolveBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    if (import.meta.env.PROD) {
      console.error('[StockFlow] ⚠️ VITE_API_URL is not defined in production! API calls will fail.');
    }
    return '/api';
  }
  // Strip trailing slash to avoid double-slash in URLs like /api//products
  return url.replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Erreur réseau';
    return Promise.reject(new Error(message));
  }
);

// ===== Products =====
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// ===== Stock =====
export const stockService = {
  createEntry: (data) => api.post('/stock/entry', data),
  getMovements: (params) => api.get('/stock/movements', { params }),
  getMovement: (id) => api.get(`/stock/movements/${id}`),
  deleteMovement: (id) => api.delete(`/stock/movements/${id}`),
};

// ===== Sales =====
export const saleService = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  delete: (id) => api.delete(`/sales/${id}`),
};

// ===== Dashboard =====
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getSalesChart: (params) => api.get('/dashboard/sales-chart', { params }),
  getProfitChart: (params) => api.get('/dashboard/profit-chart', { params }),
  getStockByCategory: () => api.get('/dashboard/stock-by-category'),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getLowStock: () => api.get('/dashboard/low-stock'),
};

// ===== Reports =====
export const reportService = {
  getProfit: (params) => api.get('/reports/profit', { params }),
  getSales: (params) => api.get('/reports/sales', { params }),
};

export default api;
