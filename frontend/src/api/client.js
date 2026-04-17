import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Feeds API
export const feedsApi = {
  getAll: (params = {}) => api.get('/feeds/', { params }),
  getById: (id) => api.get(`/feeds/${id}`),
  create: (data) => api.post('/feeds/', data),
  update: (id, data) => api.put(`/feeds/${id}`, data),
  delete: (id) => api.delete(`/feeds/${id}`),
  assignKeywords: (id, keywordIds) => api.post(`/feeds/${id}/keywords`, { feed_id: id, keyword_ids: keywordIds }),
  triggerCheck: (id) => api.post(`/feeds/${id}/check`),
};

// Keywords API
export const keywordsApi = {
  getAll: (params = {}) => api.get('/keywords/', { params }),
  getById: (id) => api.get(`/keywords/${id}`),
  create: (data) => api.post('/keywords/', data),
  update: (id, data) => api.put(`/keywords/${id}`, data),
  delete: (id) => api.delete(`/keywords/${id}`),
};

// Alerts API
export const alertsApi = {
  getAll: (params = {}) => api.get('/alerts/', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAsUnread: (id) => api.put(`/alerts/${id}/unread`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  cleanup: (days) => api.delete('/alerts/cleanup', { params: { days } }),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Notifications API
export const notificationsApi = {
  getAll: (params = {}) => api.get('/notifications/', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  create: (data) => api.post('/notifications/', data),
  update: (id, data) => api.put(`/notifications/${id}`, data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Statistics API
export const statsApi = {
  get: () => api.get('/stats/'),
};

// API Templates API
export const templatesApi = {
  getAll: (params = {}) => api.get('/templates/', { params }),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  test: (id) => api.post(`/templates/${id}/test`),
};

// Tags API
export const tagsApi = {
  getAll: (params = {}) => api.get('/tags/', { params }),
  getById: (id) => api.get(`/tags/${id}`),
  create: (data) => api.post('/tags/', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
};

export default api;
