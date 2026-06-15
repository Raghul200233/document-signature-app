// frontend/src/services/api.js
import axios from 'axios';
import authService from './authService';

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
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authService.logout();
      window.location.href = '/login';
    }
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
  
  // Get all user documents with filters
  getAll: async (params = '') => {
    const response = await api.get(`/documents${params ? `?${params}` : ''}`);
    return response.data;
  },
  
  // Get single document by ID
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
  try {
    console.log('API download called for ID:', id);
    
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3003/api/documents/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log('Download blob size:', blob.size);
    console.log('Download blob type:', blob.type);
    
    // Check if blob is valid PDF
    if (blob.type !== 'application/pdf') {
      console.warn('Unexpected content type:', blob.type);
    }
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return { data: blob };
    
  } catch (error) {
    console.error('Download API error:', error);
    throw error;
  }
},
  
  // Update document status
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/documents/${id}/status`, statusData);
    return response.data;
  },
  
  // Get document statistics
  getStats: async () => {
    const response = await api.get('/documents/stats/summary');
    return response.data;
  },
  
  // Search documents
  search: async (query) => {
    const response = await api.get(`/documents/search?q=${query}`);
    return response.data;
  },
  
  // Get recent documents
  getRecent: async (limit = 5) => {
    const response = await api.get(`/documents/recent?limit=${limit}`);
    return response.data;
  },
  
  // Get documents by status
  getByStatus: async (status) => {
    const response = await api.get(`/documents/status/${status}`);
    return response.data;
  },
  
  // Get document activity
  getActivity: async (id) => {
    const response = await api.get(`/documents/${id}/activity`);
    return response.data;
  }
};

// Signature API calls
export const signatureAPI = {
  create: async (signatureData) => {
    const response = await api.post('/signatures', signatureData);
    return response.data;
  },

  getByDocument: async (documentId) => {
    const response = await api.get(`/signatures/document/${documentId}`);
    return response.data;
  },

  submitSignature: async (token, signatureText, style) => {
    const response = await api.post(`/signatures/${token}/sign`, { 
      signatureText, 
      style 
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/signatures/${id}`);
    return response.data;
  }
};

// Add to api.js
export const pdfAPI = {
  // Sign document with specific signature
  signDocument: async (documentId, signatureId) => {
    const response = await api.post('/pdf/sign', { documentId, signatureId });
    return response.data;
  },

  // Sign document with all signatures
  signAllSignatures: async (documentId) => {
    const response = await api.post(`/pdf/${documentId}/sign-all`);
    return response.data;
  },

  // Get signed PDF status
  getSignedPDFStatus: async (documentId) => {
    const response = await api.get(`/pdf/${documentId}/status`);
    return response.data;
  },

  // Download signed PDF
  downloadSignedPDF: async (documentId) => {
    const response = await api.get(`/pdf/${documentId}/download`);
    return response.data;
  }
};

export default api;