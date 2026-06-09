import axios from 'axios';

const API_URL = 'http://localhost:3003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Document API calls
export const documentAPI = {
  upload: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getAll: async (params = '') => {
    const response = await api.get(`/documents${params ? `?${params}` : ''}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
  
  download: async (id) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },
  
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/documents/${id}/status`, statusData);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/documents/stats/summary');
    return response.data;
  },
  
  search: async (query) => {
    const response = await api.get(`/documents/search?q=${query}`);
    return response.data;
  },
  
  getRecent: async (limit = 5) => {
    const response = await api.get(`/documents/recent?limit=${limit}`);
    return response.data;
  }
};

export default api;