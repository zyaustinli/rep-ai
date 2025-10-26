import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// API functions
// WebSocket helper
export const createWebSocket = (sessionId: string): WebSocket => {
  const wsUrl = API_URL.replace('http', 'ws');
  return new WebSocket(`${wsUrl}/api/sessions/${sessionId}/conversation`);
};

export const apiClient = {
  // Products
  products: {
    list: () => api.get('/api/products'),
    create: (data: any) => api.post('/api/products', data),
    get: (id: string) => api.get(`/api/products/${id}`),
    update: (id: string, data: any) => api.patch(`/api/products/${id}`, data),
    delete: (id: string) => api.delete(`/api/products/${id}`),

    // RAG endpoints
    vectorize: (id: string, force: boolean = false) =>
      api.post(`/api/products/${id}/vectorize`, {}, { params: { force } }),
    query: (id: string, query: string, top_k: number = 5) =>
      api.post(`/api/products/${id}/query`, {}, { params: { query, top_k } }),

    // Document management
    uploadDocument: (id: string, file: File, onProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/api/products/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
    },
    listDocuments: (id: string) => api.get(`/api/products/${id}/documents`),
    getDocument: (productId: string, documentId: string) =>
      api.get(`/api/products/${productId}/documents/${documentId}`),
    deleteDocument: (productId: string, documentId: string) =>
      api.delete(`/api/products/${productId}/documents/${documentId}`),
  },

  // Sessions
  sessions: {
    list: (params?: any) => api.get('/api/sessions', { params }),
    create: (data: any) => api.post('/api/sessions', data),
    get: (id: string) => api.get(`/api/sessions/${id}`),
    generateScenario: (data: any) => api.post('/api/sessions/generate-scenario', data),
    generateScenarioSimple: (data: any) => api.post('/api/sessions/generate-scenario-simple', data),
    analyze: (id: string) => api.post(`/api/sessions/${id}/analyze`),
    getAssistant: (id: string) => api.get(`/api/sessions/${id}/assistant`),
    getTranscript: (id: string) => api.get(`/api/sessions/${id}/transcript`),
    saveTranscript: (id: string, data: any) => api.post(`/api/sessions/${id}/transcript`, data),
    getHints: (id: string) => api.get(`/api/sessions/${id}/hints`),
  },

  // Analysis
  analysis: {
    get: (sessionId: string) => api.get(`/api/sessions/${sessionId}/analysis`),
    triggerAudioAnalysis: (sessionId: string) => api.post(`/api/sessions/${sessionId}/analyze-audio`),
  },

  // User
  user: {
    getProfile: () => api.get('/api/users/me'),
    updateProfile: (data: any) => api.patch('/api/users/me', data),
    getStats: () => api.get('/api/users/me/stats'),
  },

  // Analytics
  analytics: {
    overview: () => api.get('/api/analytics/overview'),
    progress: (period?: string) => api.get('/api/analytics/progress', { params: { period } }),
    skills: () => api.get('/api/analytics/skills'),
  },
};

export default api;
