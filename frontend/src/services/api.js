import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  signup: (data) => apiClient.post('/auth/signup', data),
  login: (data) => apiClient.post('/auth/login', data),
  verifyOtp: (data) => apiClient.post('/auth/verify-otp', data),
};

export const gmailApi = {
  getAuthUrl: (writeAccess = false) => 
    apiClient.get(`/connect-gmail?write_access=${writeAccess}`),
};

export const profileApi = {
  getStats: (userId = 'demo-user-1') => {
    const token = localStorage.getItem('gmail_token') || '';
    return apiClient.get(`/profile/stats?user_id=${userId}&token=${encodeURIComponent(token)}`);
  },
};

export const scanApi = {
  triggerScan: (userId = 'demo-user-1', limit = 500, fromDate = null, toDate = null) => {
    const token = localStorage.getItem('gmail_token') || '';
    let url = `/scan?user_id=${userId}&token=${encodeURIComponent(token)}&limit=${limit}`;
    if (fromDate) url += `&from_date=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&to_date=${encodeURIComponent(toDate)}`;
    return apiClient.post(url);
  },
  getScanStatus: () => 
    apiClient.get('/scan/status'),
  getRangeMetrics: () => 
    apiClient.get('/scan/range-metrics'),
};

export const categoriesApi = {
  getCategories: (userId = 'demo-user-1') => 
    apiClient.get(`/categories?user_id=${userId}`),
  getCategoriesRollup: (userId = 'demo-user-1') => 
    apiClient.get(`/categories/rollup?user_id=${userId}`),
  getClusterEmails: (clusterId) => 
    apiClient.get(`/categories/${encodeURIComponent(clusterId)}/emails`),
};

export const actionsApi = {
  approveAction: (data) => 
    apiClient.post('/actions/approve', data),
  bulkApproveAction: (data) => 
    apiClient.post('/actions/bulk-approve', data),
  unsubscribe: (data) => 
    apiClient.post('/actions/unsubscribe', data),
};

export const feedbackApi = {
  getFeedback: () => apiClient.get('/feedback'),
  submitFeedback: (data) => apiClient.post('/feedback', data),
  getStats: () => apiClient.get('/stats'),
};

export default apiClient;
