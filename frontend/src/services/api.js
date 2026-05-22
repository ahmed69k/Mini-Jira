import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://mini-jira-alb-561216234.us-east-1.elb.amazonaws.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Projects API helpers
export const projectsAPI = {
  getAll: async (teamId) => {
    const url = teamId ? `/api/projects?teamId=${teamId}` : '/api/projects';
    const res = await api.get(url);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/projects', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/projects/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/api/projects/${id}`);
    return res.data;
  },
};

// Comments API helpers
export const commentsAPI = {
  getByTaskId: async (taskId) => {
    const res = await api.get(`/api/comments/${taskId}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/comments', data);
    return res.data;
  },
};
