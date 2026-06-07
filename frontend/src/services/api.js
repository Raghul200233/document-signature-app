import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
  // Upload document
  upload: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Get all user documents
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  
  // Get single document
  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  // Delete document
  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
  
  // Download document
  download: async (id) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },
  
  // Update document status
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/documents/${id}/status`, statusData);
    return response.data;
  }
};

export default api;