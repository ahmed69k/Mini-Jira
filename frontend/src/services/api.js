const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('accessToken');

// Helper to make API calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || errorData.message || `Error: ${response.status}`);
  }

  return await response.json();
};

// ===== PROJECTS =====
export const projectsAPI = {
  // Get all projects
  getAll: async () => {
    return apiCall('/projects', 'GET');
  },

  // Get single project
  getById: async (projectId) => {
    return apiCall(`/projects/${projectId}`, 'GET');
  },

  // Create project
  create: async (data) => {
    return apiCall('/projects', 'POST', data);
  },

  // Update project
  update: async (projectId, data) => {
    return apiCall(`/projects/${projectId}`, 'PUT', data);
  },

  // Delete project
  delete: async (projectId) => {
    return apiCall(`/projects/${projectId}`, 'DELETE');
  },
};

// ===== COMMENTS =====
export const commentsAPI = {
  // Get comments by task ID
  getByTaskId: async (taskId) => {
    return apiCall(`/comments/${taskId}`, 'GET');
  },

  // Create comment
  create: async (data) => {
    return apiCall('/comments', 'POST', data);
  },
};
