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

export const scanApi = {
  triggerScan: (userId = 'demo-user-1', limit = 500) => {
    const token = localStorage.getItem('gmail_token') || '';
    return apiClient.post(`/scan?user_id=${userId}&token=${encodeURIComponent(token)}&limit=${limit}`);
  },
  getScanStatus: () => 
    apiClient.get('/scan/status'),
};

export const categoriesApi = {
  getCategories: (userId = 'demo-user-1') => 
    apiClient.get(`/categories?user_id=${userId}`),
};

export const actionsApi = {
  approveAction: (data) => 
    apiClient.post('/actions/approve', data),
};

export const feedbackApi = {
  getFeedback: () => apiClient.get('/feedback'),
  submitFeedback: (data) => apiClient.post('/feedback', data),
  getStats: () => apiClient.get('/stats'),
};

export default apiClient;
