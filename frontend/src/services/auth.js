const API_URL = import.meta.env.VITE_API_URL || '';

export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data = await response.json();
    // Store token in localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify({
      userId: data.userId,
      email: data.email,
      role: data.role,
      teamId: data.teamId
    }));
    return data;
  },

  register: async (email, password, teamId) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, teamId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    const data = await response.json();
    // Auto-login after registration
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify({
      userId: data.userId,
      email: data.email,
      role: data.role,
      teamId: data.teamId
    }));
    return data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};
