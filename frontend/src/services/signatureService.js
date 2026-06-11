import api from './api';

export const signatureAPI = {
  // Create signature placement
  create: async (signatureData) => {
    try {
      const response = await api.post('/signatures', signatureData);
      return response.data;
    } catch (error) {
      console.error('Create signature error:', error);
      throw error;
    }
  },

  // Get signatures for a document
  getByDocument: async (documentId) => {
    try {
      const response = await api.get(`/signatures/document/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Get signatures error:', error);
      return { signatures: [] };
    }
  },

  // Update signature position
  updatePosition: async (id, positionData) => {
    const response = await api.put(`/signatures/${id}`, positionData);
    return response.data;
  },

  // Delete signature
  delete: async (id) => {
    const response = await api.delete(`/signatures/${id}`);
    return response.data;
  },

  // Submit signature via token (public)
  submitSignature: async (token, signatureData) => {
    const response = await api.post(`/signatures/${token}/sign`, { signatureData });
    return response.data;
  }
};

export default signatureAPI;